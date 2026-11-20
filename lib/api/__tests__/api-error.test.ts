import { ApiRequestError, unwrapApiResult } from "../api-error";

describe("unwrapApiResult", () => {
  it("returns the data of a successful result", () => {
    expect(
      unwrapApiResult({ status: true, statusCode: 200, message: "Success", data: { id: 1 } }),
    ).toEqual({
      id: 1,
    });
  });

  it("keeps falsy-but-real data such as 0 or an empty string", () => {
    expect(unwrapApiResult({ status: true, statusCode: 200, message: "ok", data: 0 })).toBe(0);
    expect(unwrapApiResult({ status: true, statusCode: 200, message: "ok", data: "" })).toBe("");
  });

  it("throws an ApiRequestError carrying the message and status code", () => {
    const failed = { status: false, statusCode: 404, message: "Not found", data: null };

    expect(() => unwrapApiResult(failed)).toThrow(ApiRequestError);
    expect(() => unwrapApiResult(failed)).toThrow("Not found");

    try {
      unwrapApiResult(failed);
    } catch (error) {
      expect(error).toMatchObject({ name: "ApiRequestError", statusCode: 404 });
    }
  });

  it("joins an array message", () => {
    expect(() =>
      unwrapApiResult({ status: false, statusCode: 400, message: ["a", "b"], data: null }),
    ).toThrow("a, b");
  });

  it("uses a default message when the failure has none", () => {
    expect(() =>
      unwrapApiResult({ status: false, statusCode: 500, message: "", data: null }),
    ).toThrow("Something went wrong. Please try again.");
  });

  it("treats status:true with null data as a failure", () => {
    expect(() =>
      unwrapApiResult({ status: true, statusCode: 200, message: "Success", data: null }),
    ).toThrow(ApiRequestError);
  });

  it("makes ApiRequestError a normal Error", () => {
    const error = new ApiRequestError("boom", 500);

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("boom");
  });
});
