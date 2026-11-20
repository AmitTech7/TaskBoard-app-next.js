/** Every TanStack Query key lives in this one file. */
export const authKeys = {
  all: ["auth"] as const,
  currentUser: () => [...authKeys.all, "current-user"] as const,
};

export const tasksKeys = {
  all: ["tasks"] as const,
  /**
   * ONE list holding every task. Search, status filter and paging are applied locally on top of
   * it (the API can't filter), so the key needs no params and changing a filter never refetches.
   */
  list: () => [...tasksKeys.all, "list"] as const,
  detail: (id: number) => [...tasksKeys.all, "detail", id] as const,
};
