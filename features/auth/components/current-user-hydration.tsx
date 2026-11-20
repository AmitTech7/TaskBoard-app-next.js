import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { getQueryClient } from "@/lib/queries/get-query-client";
import { authKeys } from "@/lib/queries/query-keys";

import type { CurrentUser } from "../types";

interface CurrentUserHydrationProps {
  user: CurrentUser;
  children: ReactNode;
}

/**
 * SERVER component. The layout already fetched the user, so we copy it into the server-side
 * query cache and "dehydrate" it into the page. In the browser `useCurrentUser()` then finds
 * the user already there instead of fetching it again.
 */
export function CurrentUserHydration({ user, children }: Readonly<CurrentUserHydrationProps>) {
  const queryClient = getQueryClient();
  queryClient.setQueryData(authKeys.currentUser(), user);

  return <HydrationBoundary state={dehydrate(queryClient)}>{children}</HydrationBoundary>;
}
