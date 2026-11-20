import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { mapApiResult } from "@/lib/api/map-result";

import { ALL_RECORDS_LIMIT } from "../constants";
import type { RemoteTodo, RemoteTodosResponse } from "../types";
import { mapRemoteTodo, mapRemoteTodos } from "./mappers";

/** Browser-side reads (used by TanStack Query hooks). Writes are server actions in ./actions. */

export async function fetchTasks(signal?: AbortSignal) {
  const response = await apiClient.get<RemoteTodosResponse>(API_ENDPOINTS.REMOTE.TODOS.LIST, {
    params: { limit: ALL_RECORDS_LIMIT },
    signal,
  });

  return mapApiResult(response, mapRemoteTodos);
}

export async function fetchTask(id: number, signal?: AbortSignal) {
  const response = await apiClient.get<RemoteTodo>(API_ENDPOINTS.REMOTE.TODOS.DETAIL(id), {
    signal,
  });

  return mapApiResult(response, mapRemoteTodo);
}
