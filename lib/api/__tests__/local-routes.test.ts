/**
 * Regression tests for a real bug: our own /api/auth/* route handlers already answer with an
 * `ApiResponse`, and `apiClient` wrapped that a SECOND time. After login the cache held
 * `{ status, statusCode, message, data: user }` instead of the user, so `user.firstName` was
 * `undefined` and the user menu crashed.
 *
 * These tests run the real `apiClient` + `mapResponse` together (only `fetch` is faked), because
 * the bug lived in how the two combine. Tests that fake the response body as `{}` can't see it.
 */
import { createFakeResponse } from "@/lib/test-utils/fake-response";

import type { apiClient as ApiClient } from "../client";
import { mapResponse } from "../map-response";

const USER = {
  id: 1,
  username: "emilys",
  email: "emily@example.com",
  firstName: "Emily",
  lastName: "Johnson",
  image: "https://example.com/emily.png",
};

/** What our route handlers send: an ApiResponse. */
const ROUTE_SUCCESS = { status: true, statusCode: 200, message: "Success", data: USER };
const ROUTE_FAILURE = {
  status: false,
  statusCode: 400,
  message: "Invalid credentials",
  data: null,
};

const fetchMock = jest.fn();

async function loadClient(): Promise<typeof ApiClient> {
  jest.resetModules();
  process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";

  return (await import("../client")).apiClient;
}

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock;
});

describe("apiClient calling OUR OWN routes (isLocal)", () => {
  it("returns the user directly in result.data (not wrapped a second time)", async () => {
    fetchMock.mockResolvedValue(createFakeResponse(ROUTE_SUCCESS, { status: 200 }));
    const client = await loadClient();

    const result = await client.post<typeof USER>("/api/auth/login", { isLocal: true, body: {} });

    expect(result.data).toEqual(USER);
    expect(result.data?.firstName).toBe("Emily");
    expect(result.data).not.toHaveProperty("status");
  });

  it("keeps a failure's own message and status code", async () => {
    fetchMock.mockResolvedValue(createFakeResponse(ROUTE_FAILURE, { status: 400 }));
    const client = await loadClient();

    expect(await client.post("/api/auth/login", { isLocal: true, body: {} })).toEqual(
      ROUTE_FAILURE,
    );
  });

  it("keeps a list of messages", async () => {
    const body = { ...ROUTE_FAILURE, message: ["Username is required", "Password is too short"] };
    fetchMock.mockResolvedValue(createFakeResponse(body, { status: 400 }));
    const client = await loadClient();

    const result = await client.post("/api/auth/login", { isLocal: true, body: {} });

    expect(result.message).toEqual(["Username is required", "Password is too short"]);
  });

  it("still maps a non-ApiResponse reply (like Next's own error page) to a failure", async () => {
    fetchMock.mockResolvedValue(
      createFakeResponse(null, {
        status: 500,
        statusText: "Internal Server Error",
        hasInvalidJson: true,
      }),
    );
    const client = await loadClient();

    expect(await client.get("/api/auth/get-current-user", { isLocal: true })).toEqual({
      status: false,
      statusCode: 500,
      message: "Internal Server Error",
      data: null,
    });
  });
});

describe("apiClient calling the REMOTE API (not isLocal)", () => {
  it("still wraps the raw body, because DummyJSON does not use our shape", async () => {
    fetchMock.mockResolvedValue(createFakeResponse(USER));
    const client = await loadClient();

    const result = await client.get<typeof USER>("/auth/me");

    expect(result).toEqual({ status: true, statusCode: 200, message: "Success", data: USER });
  });

  it("does NOT unwrap a remote body that merely looks like an ApiResponse", async () => {
    fetchMock.mockResolvedValue(createFakeResponse(ROUTE_SUCCESS));
    const client = await loadClient();

    const result = await client.get("/something");

    // The remote body is kept whole as `data`: only OUR routes get the pass-through.
    expect(result.data).toEqual(ROUTE_SUCCESS);
  });
});

describe("mapResponse with isAlreadyWrapped", () => {
  it("passes a matching ApiResponse through untouched", async () => {
    const result = await mapResponse(createFakeResponse(ROUTE_SUCCESS), { isAlreadyWrapped: true });

    expect(result).toEqual(ROUTE_SUCCESS);
  });

  it("wraps normally when the flag is off", async () => {
    const result = await mapResponse(createFakeResponse(ROUTE_SUCCESS));

    expect(result.data).toEqual(ROUTE_SUCCESS);
  });

  it("wraps normally when the body is not ApiResponse-shaped", async () => {
    const result = await mapResponse(createFakeResponse({ id: 1 }), { isAlreadyWrapped: true });

    expect(result).toEqual({ status: true, statusCode: 200, message: "Success", data: { id: 1 } });
  });

  it.each([
    ["status is not a boolean", { ...ROUTE_SUCCESS, status: "true" }],
    ["statusCode is missing", { status: true, message: "m", data: {} }],
    ["statusCode is not a number", { ...ROUTE_SUCCESS, statusCode: "200" }],
    ["message is missing", { status: true, statusCode: 200, data: {} }],
    ["data is missing", { status: true, statusCode: 200, message: "m" }],
    ["it is a list", [ROUTE_SUCCESS]],
    ["it is a string", "ok"],
  ])("does not treat a body as an ApiResponse when %s", async (_label, body) => {
    const result = await mapResponse(createFakeResponse(body), { isAlreadyWrapped: true });

    // Wrapped as ordinary data instead of being passed through.
    expect(result.data).toEqual(body);
  });

  it("treats 'status: true' inside a 500 reply as a FAILURE (contradictory)", async () => {
    const result = await mapResponse(createFakeResponse(ROUTE_SUCCESS, { status: 500 }), {
      isAlreadyWrapped: true,
    });

    expect(result).toMatchObject({ status: false, statusCode: 500, data: null });
  });

  it("treats 'status: false' inside a 200 reply as a FAILURE (contradictory)", async () => {
    const result = await mapResponse(createFakeResponse(ROUTE_FAILURE, { status: 200 }), {
      isAlreadyWrapped: true,
    });

    expect(result).toMatchObject({ status: false, data: null });
  });
});
