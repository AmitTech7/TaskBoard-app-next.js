"use client";

import { Task01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  APP_NAME,
  appRoutes,
  isNavItemActive,
  navItems,
  type NavItem,
} from "@/lib/constants/navigation";

const ICON_SIZE = 18;

interface AppSidebarNavItemProps {
  item: NavItem;
  isActive: boolean;
}

// Its own component (not defined inside AppSidebar) so React keeps each menu item stable.
function AppSidebarNavItem({ item, isActive }: Readonly<AppSidebarNavItemProps>) {
  return (
    <SidebarMenuItem>
      {/* `tooltip` shows the label when the sidebar is collapsed to icons only. */}
      <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
        <Link
          id={`nav-${item.id}`}
          href={item.href}
          aria-current={isActive ? "page" : undefined}
          className="cursor-pointer"
        >
          <HugeiconsIcon icon={item.icon} size={ICON_SIZE} />
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

/**
 * The left menu. Everything in it comes from `navItems` (lib/constants/navigation.ts).
 * Collapse with Ctrl/Cmd+B (built into SidebarProvider; the state is saved in a cookie).
 * On phones the same component becomes a slide-over overlay.
 */
export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip={APP_NAME}>
              <Link id="nav-home" href={appRoutes.DASHBOARD} className="cursor-pointer">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <HugeiconsIcon icon={Task01Icon} size={ICON_SIZE} />
                </span>
                <span className="text-base font-semibold">{APP_NAME}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <AppSidebarNavItem
                  key={item.id}
                  item={item}
                  isActive={isNavItemActive(pathname, item.href)}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
