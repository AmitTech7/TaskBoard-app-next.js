import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { unwrapApiResult } from "@/lib/api/api-error";
import { getQueryClient } from "@/lib/queries/get-query-client";
import { STALE_TIME_MEDIUM } from "@/lib/queries/query-constants";
import { tasksKeys } from "@/lib/queries/query-keys";

import { getTasks } from "../api/server";

/**
 * SERVER component. Loads the tasks on the server and hands them to the browser's cache, so the
 * page arrives with data already in it (no loading spinner on first visit).
 * `allSettled`: if the prefetch fails the page still renders, and the client retries on its own.
 */
export async function TasksBoundary({ children }: Readonly<{ children: ReactNode }>) {
  const queryClient = getQueryClient();

  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: tasksKeys.list(),
      queryFn: async () => unwrapApiResult(await getTasks()),
      staleTime: STALE_TIME_MEDIUM,
    }),
  ]);

  return <HydrationBoundary state={dehydrate(queryClient)}>{children}</HydrationBoundary>;
}
