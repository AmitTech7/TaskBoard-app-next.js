import "server-only";

import { NextResponse } from "next/server";

import type { ApiResult } from "./types";

const HTTP_OK = 200;
const HTTP_BAD_GATEWAY = 502;
// `Response` only accepts 200-599 (1xx would throw)...
const MIN_HTTP_STATUS = 200;
const MIN_ERROR_STATUS = 400;
const MAX_HTTP_STATUS = 599;
// ...and these statuses may not carry a body, but we always send a JSON body (constructing it would throw).
const NULL_BODY_STATUSES: ReadonlySet<number> = new Set([204, 205, 304]);

function resolveHttpStatus(isSuccess: boolean, statusCode: number): number {
  const isValid = statusCode >= MIN_HTTP_STATUS && statusCode <= MAX_HTTP_STATUS;

  if (isSuccess) {
    return isValid && !NULL_BODY_STATUSES.has(statusCode) ? statusCode : HTTP_OK;
  }

  // statusCode 0 means "no HTTP response was received" (see map-response.ts). A failure must
  // never go out as 2xx/3xx, so anything that isn't a real 4xx/5xx becomes 502.
  return isValid && statusCode >= MIN_ERROR_STATUS ? statusCode : HTTP_BAD_GATEWAY;
}

/** Sends an `ApiResult` from a route handler with a sensible HTTP status. */
export function respond<T>(result: ApiResult<T>): NextResponse {
  return NextResponse.json(result, { status: resolveHttpStatus(result.status, result.statusCode) });
}
