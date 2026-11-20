"use server";

import { getCurrentUser } from "@/features/auth/api/server";
import { failureResult, handleActionError, handleApiResponse } from "@/lib/api/action-helpers";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { mapApiResult } from "@/lib/api/map-result";
import { fetchServer } from "@/lib/api/server";
import type { ApiResult } from "@/lib/api/types";

import type { RemoteTodo, Task } from "../types";
import { taskFormSchema, type TaskFormValues } from "../validations/schemas";
import { mapRemoteTodo, toRemoteTodoBody } from "./mappers";

/**
 * Writes. They run on the server and are PUBLIC endpoints (anyone can call a server action
 * directly), so every action: 1) checks the user is logged in, 2) re-validates its input.
 * They never throw: they always return an `ApiResult`.
 * The demo API simulates writes: it answers "success" but saves nothing.
 */

const HTTP_BAD_REQUEST = 400;
const HTTP_UNAUTHORIZED = 401;

const NOT_LOGGED_IN_MESSAGE = "You must be logged in.";
const INVALID_ID_MESSAGE = "Invalid task id.";

function isValidTaskId(id: number): boolean {
  return Number.isInteger(id) && id > 0;
}

export async function createTaskAction(values: TaskFormValues): Promise<ApiResult<Task>> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return failureResult(HTTP_UNAUTHORIZED, NOT_LOGGED_IN_MESSAGE);
    }

    const parsed = taskFormSchema.safeParse(values);

    if (!parsed.success) {
      return failureResult(
        HTTP_BAD_REQUEST,
        parsed.error.issues.map((issue) => issue.message),
      );
    }

    const response = await fetchServer<RemoteTodo>(API_ENDPOINTS.REMOTE.TODOS.CREATE, {
      method: "POST",
      body: { ...toRemoteTodoBody(parsed.data), userId: user.id },
    });

    return handleApiResponse(mapApiResult(response, mapRemoteTodo));
  } catch (error) {
    return handleActionError(error, "Could not create the task.");
  }
}

export async function updateTaskAction(
  id: number,
  values: TaskFormValues,
): Promise<ApiResult<Task>> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return failureResult(HTTP_UNAUTHORIZED, NOT_LOGGED_IN_MESSAGE);
    }

    if (!isValidTaskId(id)) {
      return failureResult(HTTP_BAD_REQUEST, INVALID_ID_MESSAGE);
    }

    const parsed = taskFormSchema.safeParse(values);

    if (!parsed.success) {
      return failureResult(
        HTTP_BAD_REQUEST,
        parsed.error.issues.map((issue) => issue.message),
      );
    }

    const response = await fetchServer<RemoteTodo>(API_ENDPOINTS.REMOTE.TODOS.UPDATE(id), {
      method: "PUT",
      body: toRemoteTodoBody(parsed.data),
    });

    return handleApiResponse(mapApiResult(response, mapRemoteTodo));
  } catch (error) {
    return handleActionError(error, "Could not update the task.");
  }
}

export async function deleteTaskAction(id: number): Promise<ApiResult<Task>> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return failureResult(HTTP_UNAUTHORIZED, NOT_LOGGED_IN_MESSAGE);
    }

    if (!isValidTaskId(id)) {
      return failureResult(HTTP_BAD_REQUEST, INVALID_ID_MESSAGE);
    }

    const response = await fetchServer<RemoteTodo>(API_ENDPOINTS.REMOTE.TODOS.DELETE(id), {
      method: "DELETE",
    });

    return handleApiResponse(mapApiResult(response, mapRemoteTodo));
  } catch (error) {
    return handleActionError(error, "Could not delete the task.");
  }
}
