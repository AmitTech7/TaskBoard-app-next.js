"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback } from "react";
import { useForm, type ControllerProps } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { DEFAULT_TASK_STATUS, TASK_STATUS_OPTIONS } from "../constants";
import { useTaskModalStore } from "../hooks/use-task-modal-store";
import { useCreateTask, useUpdateTask } from "../hooks/use-tasks";
import type { Task } from "../types";
import { taskFormSchema, type TaskFormValues } from "../validations/schemas";

type FieldRender<TName extends keyof TaskFormValues> = ControllerProps<
  TaskFormValues,
  TName
>["render"];

// Render functions live outside the components so they aren't re-created on every render.
const renderTitle: FieldRender<"title"> = ({ field }) => (
  <FormItem controlId="input-tasks-title">
    <FormLabel>Title</FormLabel>
    <FormControl>
      <Input placeholder="What needs to be done?" autoComplete="off" {...field} />
    </FormControl>
    <FormMessage />
  </FormItem>
);

const renderStatus: FieldRender<"status"> = ({ field }) => (
  <FormItem controlId="input-tasks-status">
    <FormLabel>Status</FormLabel>
    <FormControl>
      <Combobox
        options={TASK_STATUS_OPTIONS}
        value={field.value}
        onValueChange={field.onChange}
        placeholder="Select a status"
        searchPlaceholder="Search status..."
      />
    </FormControl>
    <FormMessage />
  </FormItem>
);

interface TaskFormProps {
  /** null = create a new task, a task = edit it. */
  task: Task | null;
  onDone: () => void;
}

function TaskForm({ task, onDone }: Readonly<TaskFormProps>) {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const isPending = createTask.isPending || updateTask.isPending;

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task?.title ?? "",
      status: task?.status ?? DEFAULT_TASK_STATUS,
    },
  });

  const { mutateAsync: createAsync } = createTask;
  const { mutateAsync: updateAsync } = updateTask;

  const handleValidSubmit = useCallback(
    async (values: TaskFormValues) => {
      try {
        if (task) {
          await updateAsync({ id: task.id, values });
        } else {
          await createAsync(values);
        }

        onDone();
      } catch {
        // Nothing to do: the hooks' onError already showed a toast. The form stays open to retry.
      }
    },
    [task, createAsync, updateAsync, onDone],
  );

  return (
    <Form {...form}>
      <form
        id="form-tasks"
        noValidate
        onSubmit={form.handleSubmit(handleValidSubmit)}
        className="grid gap-4"
      >
        <FormField control={form.control} name="title" render={renderTitle} />
        <FormField control={form.control} name="status" render={renderStatus} />
        <DialogFooter>
          <Button
            id="btn-tasks-form-cancel"
            type="button"
            variant="outline"
            onClick={onDone}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            id="btn-tasks-form-submit"
            type="submit"
            disabled={isPending}
            className="cursor-pointer"
          >
            {task ? "Save changes" : "Create task"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

/** One dialog for both "new task" and "edit task". Open/closed state lives in the Zustand store. */
export function TaskFormModal() {
  const isFormOpen = useTaskModalStore((state) => state.isFormOpen);
  const editingTask = useTaskModalStore((state) => state.editingTask);
  const closeForm = useTaskModalStore((state) => state.closeForm);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        closeForm();
      }
    },
    [closeForm],
  );

  return (
    <Dialog open={isFormOpen} onOpenChange={handleOpenChange}>
      <DialogContent id="modal-tasks-form">
        <DialogHeader>
          <DialogTitle>{editingTask ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>
            {editingTask ? "Change the title or status." : "Add a task to your board."}
          </DialogDescription>
        </DialogHeader>
        {/* The key gives the form fresh default values every time it opens for a different task. */}
        <TaskForm key={editingTask?.id ?? "new"} task={editingTask} onDone={closeForm} />
      </DialogContent>
    </Dialog>
  );
}
