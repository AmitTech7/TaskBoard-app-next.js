import { normalizeMessage } from "@/lib/utils/normalize-message";

import type { ApiResult, HttpMethod, QueryParams, RequestOptions } from "./types";

/**
 * Pure helpers shared by `apiClient` (browser) and `fetchServer` (server).
 * They contain NO browser- or server-only code, so both clients can import them safely.
 */

const SUCCESS_MESSAGE = "Success";
const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";
const NETWORK_ERROR_MESSAGE = "Network error. Please check your connection and try again.";
export const MISSING_BASE_URL_MESSAGE = "API base URL is not configured.";

/** statusCode used when no HTTP response was received at all (offline, DNS, CORS...). */
const NO_RESPONSE_STATUS_CODE = 0;

export function buildUrl(baseUrl: string, path: string, params?: QueryParams): string {
  const url = new URL(path, baseUrl);

  for (const [key, value] of Object.entries(params ?? {})) {
    // Skip empty filters so `?q=` and `?status=` don't clutter the URL.
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

export function buildRequestInit(
  method: HttpMethod,
  options: RequestOptions,
  extraHeaders?: Record<string, string>,
): RequestInit {
  const hasBody = options.body !== undefined;

  return {
    method,
    signal: options.signal,
    headers: {
      Accept: "application/json",
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...extraHeaders,
    },
    body: hasBody ? JSON.stringify(options.body) : undefined,
  };
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    // Empty or non-JSON body (e.g. a 204). That's fine, we just have no data.
    return null;
  }
}

function pickErrorMessage(body: unknown, fallback: string): string {
  if (typeof body === "object" && body !== null && "message" in body) {
    const { message } = body;

    if (typeof message === "string" || Array.isArray(message)) {
      return normalizeMessage(message as string | string[]) || fallback;
    }
  }

  return fallback;
}

/** Does this JSON already have the `ApiResponse` shape (status, statusCode, message, data)? */
function isApiResponse(value: unknown): value is ApiResult<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    typeof value.status === "boolean" &&
    "statusCode" in value &&
    typeof value.statusCode === "number" &&
    "message" in value &&
    "data" in value
  );
}

interface MapResponseOptions {
  /**
   * true when WE wrote the endpoint (our own /api/auth/* route handlers): its body is already an
   * `ApiResponse`, so it must be passed through. Wrapping it again would nest the real data one
   * level too deep (`result.data.data`).
   */
  isAlreadyWrapped?: boolean;
}

/**
 * DummyJSON does not return our `ApiResponse` shape (it returns the raw body, or `{ message }`
 * on errors). This wraps whatever it returns into `ApiResponse<T>` so the rest of the app
 * sees one realistic, consistent shape.
 */
export async function mapResponse<T>(
  response: Response,
  options: MapResponseOptions = {},
): Promise<ApiResult<T>> {
  const body = await readJson(response);

  if (options.isAlreadyWrapped && isApiResponse(body)) {
    // Only trust the body's own verdict when it agrees with the HTTP status: a "status: true"
    // body on a 500 (or "status: false" on a 200) is contradictory, so we call it a failure.
    // A body that isn't ApiResponse-shaped at all (e.g. an HTML error page from Next) skips this
    // block and is mapped like any other response below.
    if (body.status === response.ok) {
      return body as ApiResult<T>;
    }

    return {
      status: false,
      statusCode: response.status,
      message: GENERIC_ERROR_MESSAGE,
      data: null,
    };
  }

  if (response.ok) {
    return {
      status: true,
      statusCode: response.status,
      message: SUCCESS_MESSAGE,
      data: body as T | null,
    };
  }

  return {
    status: false,
    statusCode: response.status,
    message: pickErrorMessage(body, response.statusText || GENERIC_ERROR_MESSAGE),
    data: null,
  };
}

export function networkErrorResult<T>(): ApiResult<T> {
  return {
    status: false,
    statusCode: NO_RESPONSE_STATUS_CODE,
    message: NETWORK_ERROR_MESSAGE,
    data: null,
  };
}

export function missingBaseUrlResult<T>(): ApiResult<T> {
  return {
    status: false,
    statusCode: NO_RESPONSE_STATUS_CODE,
    message: MISSING_BASE_URL_MESSAGE,
    data: null,
  };
}
