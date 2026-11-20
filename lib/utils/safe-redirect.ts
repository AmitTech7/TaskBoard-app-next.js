// Only a path inside THIS site: starts with a single "/", not "//" or "/\" (those mean other sites).
const INTERNAL_PATH_PATTERN = /^\/(?![/\\])/;
// Browsers silently drop tabs/newlines inside URLs, so "/\t/evil.com" would become "//evil.com".
const CONTROL_CHARACTERS_PATTERN = /[\u0000-\u001f\u007f]/;
const ENCODED_SLASH_PREFIX = /^%2f/i;

/**
 * The framework has already decoded the `from` query value once. We only decode again when it
 * STILL starts with an encoded slash (double-encoded), because decoding twice would corrupt
 * legitimate text like "100%25". A malformed escape throws, so we keep the raw value then.
 */
function decodeIfStillEncoded(value: string): string {
  if (!ENCODED_SLASH_PREFIX.test(value)) {
    return value;
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Open-redirect guard. Returns `value` only if it is a safe in-site path, otherwise `fallback`.
 * Without this, `?from=//evil.com` would make our Back button send people to another website.
 */
export function getSafeRedirectPath(value: string | null | undefined, fallback: string): string {
  if (!value) {
    return fallback;
  }

  const decoded = decodeIfStillEncoded(value);
  const isSafe = INTERNAL_PATH_PATTERN.test(decoded) && !CONTROL_CHARACTERS_PATTERN.test(decoded);

  return isSafe ? decoded : fallback;
}
