import { QueryClient } from "@tanstack/react-query";

import { STALE_TIME_SHORT } from "./query-constants";

/**
 * Builds a QueryClient with our defaults. Safe to import from client AND server code.
 * - Browser: QueryProvider keeps ONE of these for the whole session.
 * - Server: use `getQueryClient()` from "./get-query-client" (one per request), never `new QueryClient()`.
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data fetched on the server is already fresh; don't refetch it the instant the page hydrates.
        staleTime: STALE_TIME_SHORT,
        retry: false,
      },
    },
  });
}
