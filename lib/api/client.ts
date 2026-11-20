import {
  buildRequestInit,
  buildUrl,
  mapResponse,
  missingBaseUrlResult,
  networkErrorResult,
} from "./map-response";
import type { ApiResult, HttpMethod, RequestOptions } from "./types";

/**
 * BROWSER client. Used by TanStack Query hooks (features/*\/api/client.ts and hooks/).
 * Server code must use `fetchServer` from "./server" instead. Never mix the two.
 */

const REMOTE_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export interface ClientRequestOptions extends RequestOptions {
  /** true = call our own Next.js route handlers (same origin) instead of the remote API. */
  isLocal?: boolean;
}

async function request<T>(
  method: HttpMethod,
  path: string,
  options: ClientRequestOptions = {},
): Promise<ApiResult<T>> {
  const baseUrl = options.isLocal ? globalThis.location.origin : REMOTE_BASE_URL;

  if (!baseUrl) {
    return missingBaseUrlResult<T>();
  }

  try {
    const response = await fetch(
      buildUrl(baseUrl, path, options.params),
      buildRequestInit(method, options),
    );

    // Our own route handlers already answer in the ApiResponse shape; don't wrap that a second time.
    return await mapResponse<T>(response, { isAlreadyWrapped: options.isLocal });
  } catch (error) {
    // An aborted request (user navigated away / query cancelled) must stay an abort,
    // so TanStack Query can tell it apart from a real failure.
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    return networkErrorResult<T>();
  }
}

export const apiClient = {
  get: <T>(path: string, options?: Omit<ClientRequestOptions, "body">) =>
    request<T>("GET", path, options),
  post: <T>(path: string, options?: ClientRequestOptions) => request<T>("POST", path, options),
  put: <T>(path: string, options?: ClientRequestOptions) => request<T>("PUT", path, options),
  delete: <T>(path: string, options?: ClientRequestOptions) => request<T>("DELETE", path, options),
};
