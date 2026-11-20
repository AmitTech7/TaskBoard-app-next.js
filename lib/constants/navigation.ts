import { CheckListIcon, DashboardSquare01Icon } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

/** Every page URL in one place. */
export const appRoutes = {
  HOME: "/",
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  TASKS: "/tasks",
} as const;

export const APP_NAME = "TaskBoard";

export interface NavItem {
  /** Used for the stable HTML id: `nav-<id>`. */
  id: string;
  label: string;
  href: string;
  icon: IconSvgElement;
}

/** The sidebar is generated from this array. To add a page to the menu, add one entry here. */
export const navItems: readonly NavItem[] = [
  { id: "dashboard", label: "Dashboard", href: appRoutes.DASHBOARD, icon: DashboardSquare01Icon },
  { id: "tasks", label: "Tasks", href: appRoutes.TASKS, icon: CheckListIcon },
];

/** `/tasks` and `/tasks/12` both count as the "Tasks" item, but `/tasks-archive` does not. */
export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Title shown in the top bar for the current URL. */
export function getPageTitle(pathname: string): string {
  return navItems.find((item) => isNavItemActive(pathname, item.href))?.label ?? APP_NAME;
}
