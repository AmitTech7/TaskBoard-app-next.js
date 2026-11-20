import { LOCAL_TASK_ID_START } from "../constants";
import type { Task, TaskCounts, TaskListParams, TaskPage } from "../types";

/** Pure functions: search + status filter, paging and counts, all done locally on the full list. */

export function filterTasks(
  tasks: readonly Task[],
  { search, status }: Pick<TaskListParams, "search" | "status">,
): Task[] {
  const needle = search.trim().toLowerCase();

  return tasks.filter((task) => {
    const matchesStatus = status === "" || task.status === status;
    const matchesSearch = needle === "" || task.title.toLowerCase().includes(needle);

    return matchesStatus && matchesSearch;
  });
}

/** A page number past the end (e.g. from an old link) is clamped to the last page, not an empty page. */
export function paginateTasks(tasks: readonly Task[], page: number, pageSize: number): TaskPage {
  const pageCount = Math.max(1, Math.ceil(tasks.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), pageCount);
  const start = (currentPage - 1) * pageSize;

  return {
    items: tasks.slice(start, start + pageSize),
    total: tasks.length,
    page: currentPage,
    pageCount,
  };
}

export function getTaskCounts(tasks: readonly Task[]): TaskCounts {
  const completed = tasks.filter((task) => task.status === "completed").length;

  return { total: tasks.length, completed, pending: tasks.length - completed };
}

export function isLocalTaskId(id: number): boolean {
  return id >= LOCAL_TASK_ID_START;
}

/** The demo API gives every new task the same id, so we number new tasks ourselves. */
export function getNextLocalTaskId(tasks: readonly Task[]): number {
  const highestLocalId = tasks.reduce(
    (highest, task) => (isLocalTaskId(task.id) ? Math.max(highest, task.id) : highest),
    LOCAL_TASK_ID_START - 1,
  );

  return highestLocalId + 1;
}
