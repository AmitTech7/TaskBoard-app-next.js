"use client";

import { usePathname } from "next/navigation";

import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserMenu } from "@/features/auth/components/user-menu";
import { getPageTitle } from "@/lib/constants/navigation";

/** The bar across the top: menu button, page title, theme switch, user menu. */
export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
      {/* Collapses the sidebar on desktop and opens the overlay on phones. */}
      <SidebarTrigger id="btn-sidebar-toggle" className="cursor-pointer" />
      <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
      <h1 className="flex-1 truncate text-base font-semibold">{getPageTitle(pathname)}</h1>
      <ThemeToggle />
      <UserMenu />
    </header>
  );
}
