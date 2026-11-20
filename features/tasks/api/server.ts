import "server-only";

import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { mapApiResult } from "@/lib/api/map-result";
import { fetchServer } from "@/lib/api/server";
import type { ApiResult } from "@/lib/api/types";

import { ALL_RECORDS_LIMIT } from "../constants";
import type { RemoteTodo, RemoteTodosResponse, Task } from "../types";
import { mapRemoteTodo, mapRemoteTodos } from "./mappers";

/** Server-side reads (used to prefetch in server components). */

export async function getTasks(): Promise<ApiResult<Task[]>> {
  const response = await fetchServer<RemoteTodosResponse>(API_ENDPOINTS.REMOTE.TODOS.LIST, {
    params: { limit: ALL_RECORDS_LIMIT },
  });

  return mapApiResult(response, mapRemoteTodos);
}

export async function getTask(id: number): Promise<ApiResult<Task>> {
  const response = await fetchServer<RemoteTodo>(API_ENDPOINTS.REMOTE.TODOS.DETAIL(id));

  return mapApiResult(response, mapRemoteTodo);
}
