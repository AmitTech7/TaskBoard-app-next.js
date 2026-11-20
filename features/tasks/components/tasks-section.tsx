"use client";

import {
  Add01Icon,
  Alert02Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Delete02Icon,
  PencilEdit01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, type MouseEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { TASK_PAGE_SIZE, TASK_STATUS_LABELS, TASK_STATUS_OPTIONS } from "../constants";
import type { Task, TaskListParams, TaskPage } from "../types";
import { buildTaskDetailHref } from "../utils/task-url";
import { TasksSearchInput } from "./tasks-search-input";

const ICON_SIZE = 16;
const SKELETON_ROW_COUNT = 5;
const SKELETON_ROW_IDS = Array.from(
  { length: SKELETON_ROW_COUNT },
  (_, index) => `skeleton-${index}`,
);
// A click on these inside a row is handled by the control itself, not by "open the row".
const INTERACTIVE_SELECTOR = "a, button";

interface TaskRowProps {
  task: Task;
  /** The list URL incl. filters, passed on to the detail page as `?from=`. */
  fromHref: string;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

// Its own component so each row owns stable handlers (no arrow functions in the JSX below).
function TaskRow({ task, fromHref, onEdit, onDelete }: Readonly<TaskRowProps>) {
  const router = useRouter();
  const detailHref = buildTaskDetailHref(task.id, fromHref);

  const handleRowClick = useCallback(
    (event: MouseEvent<HTMLTableRowElement>) => {
      if (event.target instanceof Element && event.target.closest(INTERACTIVE_SELECTOR)) {
        return;
      }

      router.push(detailHref);
    },
    [router, detailHref],
  );

  const handleEdit = useCallback(() => {
    onEdit(task);
  }, [onEdit, task]);

  const handleDelete = useCallback(() => {
    onDelete(task);
  }, [onDelete, task]);

  return (
    <TableRow onClick={handleRowClick} className="cursor-pointer">
      <TableCell className="max-w-0 min-w-48 font-medium">
        <Link
          id={`btn-tasks-open-${task.id}`}
          href={detailHref}
          className="block cursor-pointer wrap-break-word hover:underline"
        >
          {task.title}
        </Link>
      </TableCell>
      <TableCell>
        <Badge variant={task.status === "completed" ? "default" : "secondary"}>
          {TASK_STATUS_LABELS[task.status]}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <Button
          id={`btn-tasks-edit-${task.id}`}
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Edit task: ${task.title}`}
          onClick={handleEdit}
          className="cursor-pointer"
        >
          <HugeiconsIcon icon={PencilEdit01Icon} size={ICON_SIZE} />
        </Button>
        <Button
          id={`btn-tasks-delete-${task.id}`}
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Delete task: ${task.title}`}
          onClick={handleDelete}
          className="cursor-pointer text-destructive"
        >
          <HugeiconsIcon icon={Delete02Icon} size={ICON_SIZE} />
        </Button>
      </TableCell>
    </TableRow>
  );
}

interface TasksSectionProps {
  params: TaskListParams;
  view: TaskPage;
  fromHref: string;
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onCreate: () => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

/** The list screen: toolbar (search, status filter, create), the table, and paging. */
export function TasksSection({
  params,
  view,
  fromHref,
  isLoading,
  errorMessage,
  onRetry,
  onSearchChange,
  onStatusChange,
  onPageChange,
  onCreate,
  onEdit,
  onDelete,
}: Readonly<TasksSectionProps>) {
  const handlePrevious = useCallback(() => {
    onPageChange(view.page - 1);
  }, [onPageChange, view.page]);

  const handleNext = useCallback(() => {
    onPageChange(view.page + 1);
  }, [onPageChange, view.page]);

  const firstShown = view.total === 0 ? 0 : (view.page - 1) * TASK_PAGE_SIZE + 1;
  const lastShown = Math.min(view.page * TASK_PAGE_SIZE, view.total);

  return (
    <section className="flex flex-col gap-4" aria-label="Tasks">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <TasksSearchInput value={params.search} onSearch={onSearchChange} />
        <Combobox
          id="input-tasks-status-filter"
          options={TASK_STATUS_OPTIONS}
          value={params.status}
          onValueChange={onStatusChange}
          placeholder="All statuses"
          searchPlaceholder="Search status..."
          className="sm:w-48"
        />
        <Button
          id="btn-tasks-create"
          type="button"
          onClick={onCreate}
          className="cursor-pointer sm:ml-auto"
        >
          <HugeiconsIcon icon={Add01Icon} size={ICON_SIZE} />
          New task
        </Button>
      </div>

      {errorMessage === null ? (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                SKELETON_ROW_IDS.map((id) => (
                  <TableRow key={id}>
                    <TableCell colSpan={3}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading && view.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                    No tasks match your filters.
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                view.items.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    fromHref={fromHref}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-lg border border-border bg-card p-6"
        >
          <p className="flex items-center gap-2 font-medium text-destructive">
            <HugeiconsIcon icon={Alert02Icon} size={ICON_SIZE} />
            Could not load tasks
          </p>
          <p className="text-sm wrap-break-word text-muted-foreground">{errorMessage}</p>
          <Button
            id="btn-tasks-retry"
            type="button"
            variant="outline"
            onClick={onRetry}
            className="cursor-pointer"
          >
            Try again
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {isLoading ? "Loading..." : `Showing ${firstShown}-${lastShown} of ${view.total} tasks`}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Page {view.page} of {view.pageCount}
          </span>
          <Button
            id="btn-tasks-prev"
            type="button"
            variant="outline"
            size="icon"
            aria-label="Previous page"
            disabled={view.page <= 1}
            onClick={handlePrevious}
            className="cursor-pointer"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={ICON_SIZE} />
          </Button>
          <Button
            id="btn-tasks-next"
            type="button"
            variant="outline"
            size="icon"
            aria-label="Next page"
            disabled={view.page >= view.pageCount}
            onClick={handleNext}
            className="cursor-pointer"
          >
            <HugeiconsIcon icon={ArrowRight01Icon} size={ICON_SIZE} />
          </Button>
        </div>
      </div>
    </section>
  );
}
