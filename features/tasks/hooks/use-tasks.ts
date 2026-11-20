"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { unwrapApiResult } from "@/lib/api/api-error";
import { STALE_TIME_MEDIUM } from "@/lib/queries/query-constants";
import { tasksKeys } from "@/lib/queries/query-keys";

import { createTaskAction, deleteTaskAction, updateTaskAction } from "../api/actions";
import { fetchTask, fetchTasks } from "../api/client";
import { SIMULATED_WRITE_NOTE } from "../constants";
import type { Task, TaskPatch } from "../types";
import { getNextLocalTaskId, isLocalTaskId } from "../utils/task-list";
import type { TaskFormValues } from "../validations/schemas";

/**
 * The demo API saves nothing, so after a successful write we update the cache BY HAND instead of
 * refetching (a refetch would bring the old data straight back and undo the change).
 */

/** Every task. Search, filter and paging are applied on top of this list, not by the API. */
export function useTasks() {
  return useQuery({
    queryKey: tasksKeys.list(),
    queryFn: async ({ signal }) => unwrapApiResult(await fetchTasks(signal)),
    staleTime: STALE_TIME_MEDIUM,
  });
}

/** One task. Starts from the list cache when possible, so edits made in the list show up here. */
export function useTask(id: number) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: tasksKeys.detail(id),
    queryFn: async ({ signal }) => unwrapApiResult(await fetchTask(id, signal)),
    staleTime: STALE_TIME_MEDIUM,
    initialData: () =>
      queryClient.getQueryData<Task[]>(tasksKeys.list())?.find((task) => task.id === id),
    initialDataUpdatedAt: () => queryClient.getQueryState(tasksKeys.list())?.dataUpdatedAt,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: TaskFormValues) => unwrapApiResult(await createTaskAction(values)),
    onSuccess: (created) => {
      queryClient.setQueryData<Task[]>(tasksKeys.list(), (tasks) => {
        if (!tasks) {
          return tasks;
        }

        // The API answers "id 255" every time, so we give the task its own local id.
        return [{ ...created, id: getNextLocalTaskId(tasks) }, ...tasks];
      });
      toast.success("Task created", { description: SIMULATED_WRITE_NOTE });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

interface UpdateTaskVariables {
  id: number;
  values: TaskFormValues;
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values }: UpdateTaskVariables): Promise<TaskPatch> => {
      // Tasks created in this session don't exist on the API (it would answer 404), so we skip it.
      if (isLocalTaskId(id)) {
        return { id, title: values.title, status: values.status };
      }

      const updated = unwrapApiResult(await updateTaskAction(id, values));

      return { id, title: updated.title, status: updated.status };
    },
    onSuccess: (patch) => {
      queryClient.setQueryData<Task[]>(tasksKeys.list(), (tasks) =>
        tasks?.map((task) => (task.id === patch.id ? { ...task, ...patch } : task)),
      );
      queryClient.setQueryData<Task>(tasksKeys.detail(patch.id), (task) =>
        task ? { ...task, ...patch } : task,
      );
      toast.success("Task updated", { description: SIMULATED_WRITE_NOTE });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      if (!isLocalTaskId(id)) {
        unwrapApiResult(await deleteTaskAction(id));
      }

      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<Task[]>(tasksKeys.list(), (tasks) =>
        tasks?.filter((task) => task.id !== id),
      );
      queryClient.removeQueries({ queryKey: tasksKeys.detail(id), exact: true });
      toast.success("Task deleted", { description: SIMULATED_WRITE_NOTE });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
