import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

import { fetchServer } from "@/lib/api/server";
import type { ApiResult } from "@/lib/api/types";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { AUTH_TOKEN_LIFETIME_MINUTES, COOKIE_NAMES } from "@/lib/constants/cookie-helper";

import type { LoginFormValues } from "../validations/schemas";
import type { CurrentUser, LoginResult, RemoteLoginResponse, RemoteUser } from "../types";
import { mapRemoteUser } from "./mappers";

/**
 * Who is logged in? Reads the HttpOnly cookie, asks the API, returns a safe user or `null`.
 * Wrapped in React `cache()`: the layout and any page can call it during ONE request and the
 * API is only hit once.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAMES.AUTH_TOKEN)?.value;

  if (!token) {
    return null;
  }

  const response = await fetchServer<RemoteUser>(API_ENDPOINTS.REMOTE.AUTH.ME, { token });

  // Expired/invalid token, or API down: treat as logged out.
  if (!response.status || response.data === null) {
    return null;
  }

  return mapRemoteUser(response.data);
});

/** Calls the API login. Returns the safe user AND the token; the route handler puts the token in a cookie. */
export async function loginWithCredentials(
  credentials: LoginFormValues,
): Promise<ApiResult<LoginResult>> {
  const response = await fetchServer<RemoteLoginResponse>(API_ENDPOINTS.REMOTE.AUTH.LOGIN, {
    method: "POST",
    body: { ...credentials, expiresInMins: AUTH_TOKEN_LIFETIME_MINUTES },
  });

  if (!response.status || response.data === null) {
    return { ...response, data: null };
  }

  // The refresh token is intentionally ignored: this app has no refresh flow.
  return {
    ...response,
    data: { user: mapRemoteUser(response.data), token: response.data.accessToken },
  };
}
