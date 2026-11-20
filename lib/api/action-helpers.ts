import { logger } from "@/lib/logger";
import { normalizeMessage } from "@/lib/utils/normalize-message";

import type { ApiResult } from "./types";

/**
 * Helpers for server actions. Rule: a server action NEVER throws.
 * It always returns an `ApiResult`, built with one of these two helpers.
 */

const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again.";
const UNEXPECTED_ERROR_STATUS_CODE = 500;

/** Normalises a finished API response (success or failure) into the shape actions return. */
export function handleApiResponse<T>(response: ApiResult<T>): ApiResult<T> {
  // A "successful" call with no data is treated as a failure so callers never get `null` + status:true.
  if (response.status && response.data === null) {
    return {
      status: false,
      statusCode: response.statusCode,
      message: DEFAULT_ERROR_MESSAGE,
      data: null,
    };
  }

  return { ...response, message: normalizeMessage(response.message) || DEFAULT_ERROR_MESSAGE };
}

/** Builds a failed result by hand (e.g. "not logged in", "invalid input") without calling the API. */
export function failureResult<T = never>(
  statusCode: number,
  message: string | string[],
): ApiResult<T> {
  return { status: false, statusCode, message, data: null };
}

/** Use in a `catch` block: logs the real error, returns a safe failure result. */
export function handleActionError<T = never>(
  error: unknown,
  fallback: string = DEFAULT_ERROR_MESSAGE,
): ApiResult<T> {
  logger().error(fallback, error);

  return {
    status: false,
    statusCode: UNEXPECTED_ERROR_STATUS_CODE,
    message: fallback,
    data: null,
  };
}
