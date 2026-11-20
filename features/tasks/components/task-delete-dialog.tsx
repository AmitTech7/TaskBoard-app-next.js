"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { appRoutes } from "@/lib/constants/navigation";

import { TASK_QUERY_PARAMS } from "../constants";
import { useTaskModalStore } from "../hooks/use-task-modal-store";
import { useDeleteTask } from "../hooks/use-tasks";
import { getBackHref } from "../utils/task-url";

/** "Are you sure?" dialog shared by the list rows and the detail page. */
export function TaskDeleteDialog() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const task = useTaskModalStore((state) => state.taskPendingDelete);
  const cancelDelete = useTaskModalStore((state) => state.cancelDelete);
  const { mutateAsync, isPending } = useDeleteTask();

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        cancelDelete();
      }
    },
    [cancelDelete],
  );

  const handleConfirm = useCallback(async () => {
    if (!task) {
      return;
    }

    try {
      await mutateAsync(task.id);
      cancelDelete();

      // Deleted from the detail page? That task no longer exists, so go back to the list.
      if (pathname !== appRoutes.TASKS) {
        router.replace(getBackHref(searchParams.get(TASK_QUERY_PARAMS.FROM)));
      }
    } catch {
      // Nothing to do: useDeleteTask's onError already showed a toast.
    }
  }, [task, mutateAsync, cancelDelete, pathname, router, searchParams]);

  return (
    <Dialog open={task !== null} onOpenChange={handleOpenChange}>
      <DialogContent id="modal-tasks-delete">
        <DialogHeader>
          <DialogTitle>Delete this task?</DialogTitle>
          <DialogDescription className="wrap-break-word">
            {task ? `"${task.title}" will be removed from your board.` : ""}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            id="btn-tasks-delete-cancel"
            type="button"
            variant="outline"
            onClick={cancelDelete}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            id="btn-tasks-delete-confirm"
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={handleConfirm}
            className="cursor-pointer"
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
