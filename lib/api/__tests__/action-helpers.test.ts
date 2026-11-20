import { logger } from "@/lib/logger";

import { failureResult, handleActionError, handleApiResponse } from "../action-helpers";
import type { ApiResult } from "../types";

jest.mock("@/lib/logger", () => ({ logger: jest.fn() }));

const errorLog = jest.fn();

beforeEach(() => {
  errorLog.mockReset();
  jest.mocked(logger).mockReturnValue({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: errorLog,
  });
});

describe("handleApiResponse", () => {
  it("passes a successful result through", () => {
    const response: ApiResult<{ id: number }> = {
      status: true,
      statusCode: 200,
      message: "Success",
      data: { id: 1 },
    };

    expect(handleApiResponse(response)).toEqual(response);
  });

  it("turns an array message into one string", () => {
    const response: ApiResult<null> = {
      status: false,
      statusCode: 400,
      message: ["a", "b"],
      data: null,
    };

    expect(handleApiResponse(response).message).toBe("a, b");
  });

  it("keeps a failure a failure", () => {
    const response: ApiResult<null> = {
      status: false,
      statusCode: 404,
      message: "Not found",
      data: null,
    };

    expect(handleApiResponse(response)).toEqual(response);
  });

  it("uses a default message when the failure has none", () => {
    const response: ApiResult<null> = { status: false, statusCode: 500, message: "", data: null };

    expect(handleApiResponse(response).message).toBe("Something went wrong. Please try again.");
  });

  it("treats 'success but no data' as a failure (never status:true with null data)", () => {
    const response: ApiResult<{ id: number }> = {
      status: true,
      statusCode: 200,
      message: "Success",
      data: null,
    };

    expect(handleApiResponse(response)).toMatchObject({
      status: false,
      statusCode: 200,
      data: null,
    });
  });
});

describe("handleActionError", () => {
  it("returns a safe failure with the fallback message", () => {
    expect(handleActionError(new Error("db exploded"), "Could not save.")).toEqual({
      status: false,
      statusCode: 500,
      message: "Could not save.",
      data: null,
    });
  });

  it("never leaks the real error text to the caller", () => {
    const result = handleActionError(new Error("password=hunter2"), "Could not save.");

    expect(JSON.stringify(result)).not.toContain("hunter2");
  });

  it("logs the real error for developers", () => {
    const error = new Error("db exploded");

    handleActionError(error, "Could not save.");

    expect(errorLog).toHaveBeenCalledWith("Could not save.", error);
  });

  it("has a default fallback message", () => {
    expect(handleActionError(new Error("x")).message).toBe(
      "Something went wrong. Please try again.",
    );
  });
});

describe("failureResult", () => {
  it("builds a failed result by hand", () => {
    expect(failureResult(401, "You must be logged in.")).toEqual({
      status: false,
      statusCode: 401,
      message: "You must be logged in.",
      data: null,
    });
  });

  it("accepts a list of messages", () => {
    expect(failureResult(400, ["a", "b"]).message).toEqual(["a", "b"]);
  });
});
