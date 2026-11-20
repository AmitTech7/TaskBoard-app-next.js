import { createFakeResponse } from "@/lib/test-utils/fake-response";

import { MISSING_BASE_URL_MESSAGE } from "../map-response";
import { fetchServer } from "../server";

const fetchMock = jest.fn();

describe("fetchServer", () => {
  const originalUrl = process.env.API_URL;

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
    process.env.API_URL = "https://api.example.com";
  });

  afterAll(() => {
    process.env.API_URL = originalUrl;
  });

  it("GETs by default and maps the response", async () => {
    fetchMock.mockResolvedValue(createFakeResponse({ id: 1 }));

    const result = await fetchServer("/auth/me");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/auth/me",
      expect.objectContaining({ method: "GET" }),
    );
    expect(result).toMatchObject({ status: true, data: { id: 1 } });
  });

  it("sends the token as a Bearer Authorization header", async () => {
    fetchMock.mockResolvedValue(createFakeResponse({}));

    await fetchServer("/auth/me", { token: "secret-token" });

    const [, init] = fetchMock.mock.calls[0];

    expect(init.headers).toMatchObject({ Authorization: "Bearer secret-token" });
  });

  it("sends no Authorization header without a token", async () => {
    fetchMock.mockResolvedValue(createFakeResponse({}));

    await fetchServer("/todos");

    const [, init] = fetchMock.mock.calls[0];

    expect(init.headers).not.toHaveProperty("Authorization");
  });

  it("supports other methods, bodies and query params", async () => {
    fetchMock.mockResolvedValue(createFakeResponse({}, { status: 201 }));

    await fetchServer("/todos/add", { method: "POST", body: { todo: "x" }, params: { a: 1 } });

    const [url, init] = fetchMock.mock.calls[0];

    expect(url).toBe("https://api.example.com/todos/add?a=1");
    expect(init).toMatchObject({ method: "POST", body: '{"todo":"x"}' });
  });

  it("maps an API error to a failed result", async () => {
    fetchMock.mockResolvedValue(
      createFakeResponse({ message: "Access Token is required" }, { status: 401 }),
    );

    expect(await fetchServer("/auth/me")).toEqual({
      status: false,
      statusCode: 401,
      message: "Access Token is required",
      data: null,
    });
  });

  it("returns a failed result when API_URL is not configured (and never calls fetch)", async () => {
    delete process.env.API_URL;

    expect(await fetchServer("/todos")).toMatchObject({
      status: false,
      message: MISSING_BASE_URL_MESSAGE,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("turns any fetch failure into a failed result instead of throwing", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));

    expect(await fetchServer("/todos")).toMatchObject({ status: false, statusCode: 0 });
  });
});
