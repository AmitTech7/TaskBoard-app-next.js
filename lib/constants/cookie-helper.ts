/** Every cookie name in one place (never write a cookie name string anywhere else). */
export const COOKIE_NAMES = {
  AUTH_TOKEN: "auth_token",
  /** Sidebar open/collapsed. Written by the shadcn sidebar, read on the server for first paint. */
  SIDEBAR_STATE: "sidebar_state",
} as const;

/** The sidebar cookie holds the literal string "true" (open) or "false" (collapsed). */
export const SIDEBAR_COLLAPSED_VALUE = "false";

const SECONDS_PER_MINUTE = 60;

/** DummyJSON access tokens live 60 minutes by default; the cookie expires with them. */
export const AUTH_TOKEN_LIFETIME_MINUTES = 60;

/**
 * Options for the auth cookie.
 * - httpOnly: JavaScript in the browser can NEVER read it (protects against XSS token theft).
 * - sameSite "lax": not sent on cross-site POSTs (basic CSRF protection).
 * - secure: only over HTTPS in production.
 */
export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: AUTH_TOKEN_LIFETIME_MINUTES * SECONDS_PER_MINUTE,
  };
}
