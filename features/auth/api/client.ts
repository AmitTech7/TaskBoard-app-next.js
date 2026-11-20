import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

import type { CurrentUser, LogoutResult } from "../types";
import type { LoginFormValues } from "../validations/schemas";

/** Browser-side auth calls. They hit OUR route handlers (isLocal), which hold the HttpOnly cookie. */

export function loginRequest(values: LoginFormValues) {
  return apiClient.post<CurrentUser>(API_ENDPOINTS.LOCAL.AUTH.LOGIN, {
    isLocal: true,
    body: values,
  });
}

export function logoutRequest() {
  return apiClient.post<LogoutResult>(API_ENDPOINTS.LOCAL.AUTH.LOGOUT, { isLocal: true });
}

export function fetchCurrentUser(signal?: AbortSignal) {
  return apiClient.get<CurrentUser>(API_ENDPOINTS.LOCAL.AUTH.CURRENT_USER, {
    isLocal: true,
    signal,
  });
}
