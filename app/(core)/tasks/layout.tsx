import type { ReactNode } from "react";

import { TaskDeleteDialog } from "@/features/tasks/components/task-delete-dialog";
import { TaskFormModal } from "@/features/tasks/components/task-form-modal";

/**
 * Wraps every /tasks page (the list AND the detail page). The two dialogs are mounted here once,
 * so "edit" and "delete" work identically from either page.
 */
export default function TasksLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      {children}
      <TaskFormModal />
      <TaskDeleteDialog />
    </>
  );
}
