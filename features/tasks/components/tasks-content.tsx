"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

import { TASK_PAGE_SIZE } from "../constants";
import type { Task } from "../types";
import { useTaskModalStore } from "../hooks/use-task-modal-store";
import { useTasks } from "../hooks/use-tasks";
import { filterTasks, paginateTasks } from "../utils/task-list";
import { buildTasksListHref } from "../utils/task-url";
import { parseTaskListParams, taskListParamsSchema } from "../validations/schemas";
import { TasksSection } from "./tasks-section";

const FIRST_PAGE = 1;
// A stable empty list (a new `[]` each render would defeat useMemo below).
const NO_TASKS: readonly Task[] = [];

/**
 * Connects three things: the URL (search/status/page), the data (TanStack Query) and the dialogs
 * (Zustand). The URL is the source of truth for filters, so refresh, share and Back all work.
 */
export function TasksContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const params = useMemo(() => parseTaskListParams(searchParams), [searchParams]);
  const { data, isPending, isError, error, refetch } = useTasks();

  const view = useMemo(
    () => paginateTasks(filterTasks(data ?? NO_TASKS, params), params.page, TASK_PAGE_SIZE),
    [data, params],
  );

  const openCreate = useTaskModalStore((state) => state.openCreate);
  const openEdit = useTaskModalStore((state) => state.openEdit);
  const requestDelete = useTaskModalStore((state) => state.requestDelete);

  const navigate = useCallback(
    (next: Partial<typeof params>) => {
      // `replace` (not `push`): typing a search shouldn't fill the Back button with history entries.
      router.replace(buildTasksListHref({ ...params, ...next }), { scroll: false });
    },
    [router, params],
  );

  const handleSearchChange = useCallback(
    (search: string) => {
      navigate({ search, page: FIRST_PAGE });
    },
    [navigate],
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      // The Combobox gives us a string; the schema turns anything unexpected into "" (all).
      navigate({ status: taskListParamsSchema.shape.status.parse(value), page: FIRST_PAGE });
    },
    [navigate],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      navigate({ page });
    },
    [navigate],
  );

  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  // The URL the detail page's Back button should return to (this list, with its filters).
  const fromHref = buildTasksListHref({ ...params, page: view.page });

  return (
    <TasksSection
      params={params}
      view={view}
      fromHref={fromHref}
      isLoading={isPending}
      errorMessage={isError ? error.message : null}
      onRetry={handleRetry}
      onSearchChange={handleSearchChange}
      onStatusChange={handleStatusChange}
      onPageChange={handlePageChange}
      onCreate={openCreate}
      onEdit={openEdit}
      onDelete={requestDelete}
    />
  );
}
