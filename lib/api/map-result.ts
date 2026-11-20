import type { ApiResult } from "./types";

/** Converts the data inside an `ApiResult` (e.g. a DummyJSON todo into our `Task`), keeping status and message. */
export function mapApiResult<TFrom, TTo>(
  result: ApiResult<TFrom>,
  mapData: (data: TFrom) => TTo,
): ApiResult<TTo> {
  if (!result.status || result.data === null) {
    return { ...result, data: null };
  }

  return { ...result, data: mapData(result.data) };
}
