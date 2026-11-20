import { mapApiResult } from "../map-result";
import type { ApiResult } from "../types";

describe("mapApiResult", () => {
  it("transforms the data and keeps status, code and message", () => {
    const result: ApiResult<number> = {
      status: true,
      statusCode: 201,
      message: "Created",
      data: 2,
    };

    expect(mapApiResult(result, (value) => value * 10)).toEqual({
      status: true,
      statusCode: 201,
      message: "Created",
      data: 20,
    });
  });

  it("does not call the mapper for a failed result", () => {
    const mapper = jest.fn();
    const failed: ApiResult<number> = {
      status: false,
      statusCode: 404,
      message: "Not found",
      data: null,
    };

    expect(mapApiResult(failed, mapper)).toEqual(failed);
    expect(mapper).not.toHaveBeenCalled();
  });

  it("does not call the mapper when a successful result has null data", () => {
    const mapper = jest.fn();
    const empty: ApiResult<number> = { status: true, statusCode: 204, message: "ok", data: null };

    expect(mapApiResult(empty, mapper)).toEqual(empty);
    expect(mapper).not.toHaveBeenCalled();
  });
});
