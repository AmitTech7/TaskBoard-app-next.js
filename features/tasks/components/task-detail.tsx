"use client";

import { ArrowLeft01Icon, Delete02Icon, PencilEdit01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { TASK_QUERY_PARAMS, TASK_STATUS_LABELS } from "../constants";
import { useTaskModalStore } from "../hooks/use-task-modal-store";
import { useTask } from "../hooks/use-tasks";
import { getBackHref } from "../utils/task-url";

const ICON_SIZE = 16;

interface TaskDetailProps {
  taskId: number;
}

export function TaskDetail({ taskId }: Readonly<TaskDetailProps>) {
  const searchParams = useSearchParams();
  // Back returns to the exact list URL we came from (filters and page included).
  // getBackHref refuses anything that isn't a safe in-site path (open-redirect protection).
  const backHref = getBackHref(searchParams.get(TASK_QUERY_PARAMS.FROM));

  const { data: task, isPending, isError, error } = useTask(taskId);
  const openEdit = useTaskModalStore((state) => state.openEdit);
  const requestDelete = useTaskModalStore((state) => state.requestDelete);

  const handleEdit = useCallback(() => {
    if (task) {
      openEdit(task);
    }
  }, [task, openEdit]);

  const handleDelete = useCallback(() => {
    if (task) {
      requestDelete(task);
    }
  }, [task, requestDelete]);

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <Button id="btn-tasks-back" asChild variant="ghost" className="w-fit cursor-pointer">
        <Link href={backHref}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={ICON_SIZE} />
          Back to tasks
        </Link>
      </Button>

      {isPending && <Skeleton className="h-40 w-full" />}

      {isError && (
        <Card role="alert">
          <CardHeader>
            <CardTitle>Task not found</CardTitle>
          </CardHeader>
          <CardContent className="text-sm wrap-break-word text-muted-foreground">
            {error.message}
          </CardContent>
        </Card>
      )}

      {task && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl wrap-break-word">{task.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <Badge variant={task.status === "completed" ? "default" : "secondary"}>
                  {TASK_STATUS_LABELS[task.status]}
                </Badge>
              </dd>
              <dt className="text-muted-foreground">Task ID</dt>
              <dd>{task.id}</dd>
              <dt className="text-muted-foreground">Owner (user ID)</dt>
              <dd>{task.userId}</dd>
            </dl>
            <div className="flex gap-2">
              <Button
                id="btn-tasks-edit"
                type="button"
                variant="outline"
                onClick={handleEdit}
                className="cursor-pointer"
              >
                <HugeiconsIcon icon={PencilEdit01Icon} size={ICON_SIZE} />
                Edit
              </Button>
              <Button
                id="btn-tasks-delete"
                type="button"
                variant="destructive"
                onClick={handleDelete}
                className="cursor-pointer"
              >
                <HugeiconsIcon icon={Delete02Icon} size={ICON_SIZE} />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
