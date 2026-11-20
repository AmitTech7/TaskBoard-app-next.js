import "server-only";

import {
  buildRequestInit,
  buildUrl,
  mapResponse,
  missingBaseUrlResult,
  networkErrorResult,
} from "./map-response";
import type { ApiResult, HttpMethod, RequestOptions } from "./types";

/**
 * SERVER client. Used by server components, prefetching, route handlers and server actions.
 * Browser code must use `apiClient` from "./client" instead. Never mix the two.
 * `import "server-only"` makes the build fail if a client component imports this file.
 */

export interface FetchServerOptions extends RequestOptions {
  method?: HttpMethod;
  /** Auth token, sent as `Authorization: Bearer <token>`. Read it from the HttpOnly cookie. */
  token?: string;
}

export async function fetchServer<T>(
  path: string,
  options: FetchServerOptions = {},
): Promise<ApiResult<T>> {
  const baseUrl = process.env.API_URL;

  if (!baseUrl) {
    return missingBaseUrlResult<T>();
  }

  const { method = "GET", token } = options;

  try {
    const response = await fetch(
      buildUrl(baseUrl, path, options.params),
      buildRequestInit(method, options, token ? { Authorization: `Bearer ${token}` } : undefined),
    );

    return await mapResponse<T>(response);
  } catch {
    return networkErrorResult<T>();
  }
}
