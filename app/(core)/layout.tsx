import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getCurrentUser } from "@/features/auth/api/server";
import { CurrentUserHydration } from "@/features/auth/components/current-user-hydration";
import { COOKIE_NAMES, SIDEBAR_COLLAPSED_VALUE } from "@/lib/constants/cookie-helper";
import { appRoutes } from "@/lib/constants/navigation";

// This layout reads cookies (auth token + sidebar state), so it can never be built once and
// cached for everyone: every request must be rendered fresh, per user.
export const dynamic = "force-dynamic";

/**
 * THE AUTH GATE + APP SHELL. Every page inside the (core) group renders through this layout,
 * so checking here protects all of them in one place.
 */
export default async function CoreLayout({ children }: Readonly<{ children: ReactNode }>) {
  const [user, cookieStore] = await Promise.all([getCurrentUser(), cookies()]);

  if (!user) {
    redirect(appRoutes.LOGIN);
  }

  // Open unless the cookie explicitly says "false". Reading it here means the sidebar is
  // already in the right state in the first HTML (no flash of the wrong width).
  const isSidebarOpen =
    cookieStore.get(COOKIE_NAMES.SIDEBAR_STATE)?.value !== SIDEBAR_COLLAPSED_VALUE;

  return (
    <CurrentUserHydration user={user}>
      {/* Needed by the sidebar's collapsed-icon tooltips. */}
      <TooltipProvider>
        <SidebarProvider defaultOpen={isSidebarOpen}>
          <AppSidebar />
          <SidebarInset>
            <TopNav />
            <div className="flex-1 p-4 md:p-6">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </CurrentUserHydration>
  );
}
