import "server-only";

import { cache } from "react";

import { makeQueryClient } from "./query-client-config";

/**
 * SERVER only. React `cache` gives every request its own QueryClient and shares it between all
 * server components of that same request (so a layout and a page can prefetch into one cache).
 */
export const getQueryClient = cache(makeQueryClient);
