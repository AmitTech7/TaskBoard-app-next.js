import { createFakeResponse } from "@/lib/test-utils/fake-response";

import type { apiClient as ApiClient } from "../client";
import { MISSING_BASE_URL_MESSAGE } from "../map-response";

const REMOTE_URL = "https://api.example.com";

const fetchMock = jest.fn();

/**
 * `client.ts` reads NEXT_PUBLIC_API_URL once, when the file is first loaded. So each test sets the
 * variable it wants and loads a fresh copy of the module.
 */
async function loadClient(remoteUrl: string | null = REMOTE_URL): Promise<typeof ApiClient> {
  jest.resetModules();

  // `null` means "leave the variable unset". (Not `undefined`: that would trigger the default value.)
  if (remoteUrl === null) {
    delete process.env.NEXT_PUBLIC_API_URL;
  } else {
    process.env.NEXT_PUBLIC_API_URL = remoteUrl;
  }

  const loaded = await import("../client");

  return loaded.apiClient;
}

describe("apiClient", () => {
  const originalUrl = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_API_URL = originalUrl;
  });

  it("GETs the remote API with query params and maps the response", async () => {
    fetchMock.mockResolvedValue(createFakeResponse({ todos: [] }));
    const client = await loadClient();

    const result = await client.get("/todos", { params: { limit: 0 } });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/todos?limit=0",
      expect.objectContaining({ method: "GET" }),
    );
    expect(result).toMatchObject({ status: true, statusCode: 200, data: { todos: [] } });
  });

  it("POSTs a JSON body", async () => {
    fetchMock.mockResolvedValue(createFakeResponse({ id: 1 }, { status: 201 }));
    const client = await loadClient();

    await client.post("/things", { body: { name: "x" } });

    const [, init] = fetchMock.mock.calls[0];

    expect(init).toMatchObject({ method: "POST", body: '{"name":"x"}' });
  });

  it("supports PUT and DELETE", async () => {
    fetchMock.mockResolvedValue(createFakeResponse({}));
    const client = await loadClient();

    await client.put("/things/1", { body: { name: "y" } });
    await client.delete("/things/1");

    expect(fetchMock.mock.calls.map(([, init]) => init.method)).toEqual(["PUT", "DELETE"]);
  });

  it("calls OUR OWN origin (not the remote API) when isLocal is set", async () => {
    fetchMock.mockResolvedValue(createFakeResponse({}));
    const client = await loadClient();

    await client.post("/api/auth/login", { isLocal: true, body: {} });

    expect(fetchMock.mock.calls[0][0]).toBe(`${globalThis.location.origin}/api/auth/login`);
  });

  it("maps an API error to a failed result", async () => {
    fetchMock.mockResolvedValue(createFakeResponse({ message: "Not found" }, { status: 404 }));
    const client = await loadClient();

    expect(await client.get("/todos/9")).toEqual({
      status: false,
      statusCode: 404,
      message: "Not found",
      data: null,
    });
  });

  it("returns a failed result when the base URL is not configured (and never calls fetch)", async () => {
    const client = await loadClient(null);

    const result = await client.get("/todos");

    expect(result).toMatchObject({ status: false, message: MISSING_BASE_URL_MESSAGE });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("turns a network failure into a failed result instead of throwing", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    const client = await loadClient();

    expect(await client.get("/todos")).toMatchObject({ status: false, statusCode: 0 });
  });

  it("re-throws an AbortError so TanStack Query can tell a cancel from a failure", async () => {
    fetchMock.mockRejectedValue(new DOMException("Aborted", "AbortError"));
    const client = await loadClient();

    await expect(client.get("/todos")).rejects.toMatchObject({ name: "AbortError" });
  });
});
