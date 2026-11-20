"use client";

import { useQuery } from "@tanstack/react-query";

import { unwrapApiResult } from "@/lib/api/api-error";
import { STALE_TIME_MEDIUM } from "@/lib/queries/query-constants";
import { authKeys } from "@/lib/queries/query-keys";

import { fetchCurrentUser } from "../api/client";

/**
 * The logged-in user, for client components.
 * `CurrentUserHydration` (in the (core) layout) already put the user in the cache on the server,
 * so this normally returns instantly with no network request.
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.currentUser(),
    queryFn: async ({ signal }) => unwrapApiResult(await fetchCurrentUser(signal)),
    staleTime: STALE_TIME_MEDIUM,
  });
}
