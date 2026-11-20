interface FakeResponseOptions {
  status?: number;
  statusText?: string;
  /** true makes `json()` reject, like an empty or non-JSON body. */
  hasInvalidJson?: boolean;
}

const HTTP_OK = 200;
const MIN_ERROR_STATUS = 400;

/**
 * A stand-in for `fetch`'s Response. jsdom (our default test environment) has no Response class,
 * and our code only reads `ok`, `status`, `statusText` and `json()`, so a plain object is enough.
 */
export function createFakeResponse(body: unknown, options: FakeResponseOptions = {}): Response {
  const { status = HTTP_OK, statusText = "", hasInvalidJson = false } = options;

  const fake = {
    ok: status < MIN_ERROR_STATUS,
    status,
    statusText,
    json: () =>
      hasInvalidJson
        ? Promise.reject(new SyntaxError("Unexpected end of JSON"))
        : Promise.resolve(body),
  };

  return fake as unknown as Response;
}
