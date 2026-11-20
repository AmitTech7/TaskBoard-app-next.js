/** The one response shape the whole app uses, whatever the real API returns. */
export interface ApiResponse<T> {
  status: boolean;
  statusCode: number;
  message: string | string[];
  data: T;
}

/**
 * What every API call and server action returns.
 * `data` is `null` when `status` is false (the call failed), so callers must check.
 */
export type ApiResult<T> = ApiResponse<T | null>;

export type QueryParamValue = string | number | boolean | undefined;
export type QueryParams = Record<string, QueryParamValue>;

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions {
  params?: QueryParams;
  body?: unknown;
  signal?: AbortSignal;
}
