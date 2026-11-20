import { appRoutes } from "@/lib/constants/navigation";
import { getSafeRedirectPath } from "@/lib/utils/safe-redirect";

import { TASK_QUERY_PARAMS } from "../constants";
import type { TaskListParams } from "../types";

const FIRST_PAGE = 1;

/** `/tasks?q=milk&status=pending&page=2`. Default values are left out so the URL stays clean. */
export function buildTasksListHref(params: TaskListParams): string {
  const query = new URLSearchParams();

  if (params.search !== "") {
    query.set(TASK_QUERY_PARAMS.SEARCH, params.search);
  }

  if (params.status !== "") {
    query.set(TASK_QUERY_PARAMS.STATUS, params.status);
  }

  if (params.page > FIRST_PAGE) {
    query.set(TASK_QUERY_PARAMS.PAGE, String(params.page));
  }

  const queryString = query.toString();

  return queryString === "" ? appRoutes.TASKS : `${appRoutes.TASKS}?${queryString}`;
}

/** `/tasks/12?from=%2Ftasks%3Fq%3Dmilk`: remembers the list URL (with filters) for the Back button. */
export function buildTaskDetailHref(taskId: number, fromHref: string): string {
  const query = new URLSearchParams({ [TASK_QUERY_PARAMS.FROM]: fromHref });

  return `${appRoutes.TASKS}/${taskId}?${query.toString()}`;
}

/** Where Back goes: the saved list URL if it is a safe in-site path, otherwise `/tasks`. */
export function getBackHref(from: string | null | undefined): string {
  return getSafeRedirectPath(from, appRoutes.TASKS);
}
