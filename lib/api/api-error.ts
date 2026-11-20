import { normalizeMessage } from "@/lib/utils/normalize-message";

import type { ApiResult } from "./types";

const FALLBACK_MESSAGE = "Something went wrong. Please try again.";

/** Thrown by `unwrapApiResult` so TanStack Query treats a failed API result as a real error. */
export class ApiRequestError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "ApiRequestError";
    this.statusCode = statusCode;
  }
}

/**
 * Query/mutation functions must THROW on failure (that's how TanStack Query knows it failed and
 * runs `onError`). Our API layer returns results instead of throwing, so hooks call this to convert.
 */
export function unwrapApiResult<T>(result: ApiResult<T>): T {
  if (!result.status || result.data === null) {
    throw new ApiRequestError(
      normalizeMessage(result.message) || FALLBACK_MESSAGE,
      result.statusCode,
    );
  }

  return result.data;
}
