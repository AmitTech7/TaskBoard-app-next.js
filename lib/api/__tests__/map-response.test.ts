import { createFakeResponse } from "@/lib/test-utils/fake-response";

import {
  buildRequestInit,
  buildUrl,
  mapResponse,
  MISSING_BASE_URL_MESSAGE,
  missingBaseUrlResult,
  networkErrorResult,
} from "../map-response";

describe("buildUrl", () => {
  const base = "https://api.example.com";

  it("joins base and path", () => {
    expect(buildUrl(base, "/todos")).toBe("https://api.example.com/todos");
  });

  it("adds query parameters", () => {
    expect(buildUrl(base, "/todos", { limit: 10, q: "milk" })).toBe(
      "https://api.example.com/todos?limit=10&q=milk",
    );
  });

  it("skips undefined and empty-string values", () => {
    expect(buildUrl(base, "/todos", { q: "", skip: undefined, status: "done" })).toBe(
      "https://api.example.com/todos?status=done",
    );
  });

  it("keeps 0 and false (they are real values)", () => {
    expect(buildUrl(base, "/todos", { limit: 0, flag: false })).toBe(
      "https://api.example.com/todos?limit=0&flag=false",
    );
  });

  it("encodes special characters", () => {
    expect(buildUrl(base, "/todos", { q: "a&b c" })).toBe(
      "https://api.example.com/todos?q=a%26b+c",
    );
  });

  it("works with a same-origin base for local routes", () => {
    expect(buildUrl("http://localhost:3000", "/api/auth/login")).toBe(
      "http://localhost:3000/api/auth/login",
    );
  });
});

describe("buildRequestInit", () => {
  it("builds a GET with no body and no Content-Type", () => {
    const init = buildRequestInit("GET", {});

    expect(init.method).toBe("GET");
    expect(init.body).toBeUndefined();
    expect(init.headers).toEqual({ Accept: "application/json" });
  });

  it("serialises a body as JSON and sets Content-Type", () => {
    const init = buildRequestInit("POST", { body: { a: 1 } });

    expect(init.body).toBe('{"a":1}');
    expect(init.headers).toMatchObject({ "Content-Type": "application/json" });
  });

  it("sends a falsy body such as 0 or an empty string", () => {
    expect(buildRequestInit("POST", { body: 0 }).body).toBe("0");
    expect(buildRequestInit("POST", { body: "" }).body).toBe('""');
  });

  it("merges extra headers", () => {
    const init = buildRequestInit("GET", {}, { Authorization: "Bearer abc" });

    expect(init.headers).toMatchObject({ Authorization: "Bearer abc", Accept: "application/json" });
  });

  it("passes the abort signal through", () => {
    const controller = new AbortController();

    expect(buildRequestInit("GET", { signal: controller.signal }).signal).toBe(controller.signal);
  });
});

describe("mapResponse", () => {
  it("wraps a successful body in the ApiResponse shape", async () => {
    const result = await mapResponse(createFakeResponse({ todos: [] }, { status: 200 }));

    expect(result).toEqual({
      status: true,
      statusCode: 200,
      message: "Success",
      data: { todos: [] },
    });
  });

  it("keeps a 201 status code", async () => {
    const result = await mapResponse(createFakeResponse({ id: 255 }, { status: 201 }));

    expect(result.status).toBe(true);
    expect(result.statusCode).toBe(201);
  });

  it("uses the API's { message } on failure", async () => {
    const result = await mapResponse(
      createFakeResponse({ message: "Invalid credentials" }, { status: 400 }),
    );

    expect(result).toEqual({
      status: false,
      statusCode: 400,
      message: "Invalid credentials",
      data: null,
    });
  });

  it("joins an array message", async () => {
    const result = await mapResponse(createFakeResponse({ message: ["a", "b"] }, { status: 422 }));

    expect(result.message).toBe("a, b");
  });

  it("falls back to statusText when the error body has no usable message", async () => {
    const result = await mapResponse(
      createFakeResponse({ error: "x" }, { status: 500, statusText: "Server Error" }),
    );

    expect(result.message).toBe("Server Error");
  });

  it("falls back to a generic message when there is no statusText either", async () => {
    const result = await mapResponse(createFakeResponse(null, { status: 500 }));

    expect(result.message).toBe("Something went wrong. Please try again.");
  });

  it("ignores a non-string, non-array message", async () => {
    const result = await mapResponse(
      createFakeResponse({ message: 42 }, { status: 400, statusText: "Bad Request" }),
    );

    expect(result.message).toBe("Bad Request");
  });

  it("ignores an empty-array message", async () => {
    const result = await mapResponse(
      createFakeResponse({ message: [] }, { status: 400, statusText: "Bad Request" }),
    );

    expect(result.message).toBe("Bad Request");
  });

  it("copes with an empty or non-JSON body", async () => {
    const ok = await mapResponse(createFakeResponse(null, { status: 204, hasInvalidJson: true }));
    const failed = await mapResponse(
      createFakeResponse(null, { status: 502, hasInvalidJson: true }),
    );

    expect(ok).toMatchObject({ status: true, data: null });
    expect(failed).toMatchObject({ status: false, statusCode: 502, data: null });
  });
});

describe("failure helpers", () => {
  it("networkErrorResult describes a request that got no response", () => {
    expect(networkErrorResult()).toEqual({
      status: false,
      statusCode: 0,
      message: "Network error. Please check your connection and try again.",
      data: null,
    });
  });

  it("missingBaseUrlResult reports the missing configuration", () => {
    expect(missingBaseUrlResult()).toMatchObject({
      status: false,
      statusCode: 0,
      message: MISSING_BASE_URL_MESSAGE,
      data: null,
    });
  });
});
