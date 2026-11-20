import { QueryClient } from "@tanstack/react-query";

import { getQueryClient } from "../get-query-client";
import { makeQueryClient } from "../query-client-config";
import { STALE_TIME_MEDIUM, STALE_TIME_REALTIME, STALE_TIME_SHORT } from "../query-constants";
import { authKeys, tasksKeys } from "../query-keys";

describe("stale time constants", () => {
  it("are ordered realtime < short < medium", () => {
    expect(STALE_TIME_REALTIME).toBe(0);
    expect(STALE_TIME_SHORT).toBeGreaterThan(STALE_TIME_REALTIME);
    expect(STALE_TIME_MEDIUM).toBeGreaterThan(STALE_TIME_SHORT);
  });

  it("are expressed in milliseconds (30 seconds and 5 minutes)", () => {
    expect(STALE_TIME_SHORT).toBe(30_000);
    expect(STALE_TIME_MEDIUM).toBe(300_000);
  });
});

describe("makeQueryClient", () => {
  it("creates a QueryClient with our defaults", () => {
    const client = makeQueryClient();

    expect(client).toBeInstanceOf(QueryClient);
    expect(client.getDefaultOptions().queries).toMatchObject({
      staleTime: STALE_TIME_SHORT,
      retry: false,
    });
  });

  it("creates a separate client every time (never shared between users)", () => {
    expect(makeQueryClient()).not.toBe(makeQueryClient());
  });
});

describe("getQueryClient", () => {
  it("returns a QueryClient", () => {
    expect(getQueryClient()).toBeInstanceOf(QueryClient);
  });
});

describe("query keys", () => {
  it("builds the auth keys", () => {
    expect(authKeys.all).toEqual(["auth"]);
    expect(authKeys.currentUser()).toEqual(["auth", "current-user"]);
  });

  it("builds the tasks keys", () => {
    expect(tasksKeys.all).toEqual(["tasks"]);
    expect(tasksKeys.list()).toEqual(["tasks", "list"]);
    expect(tasksKeys.detail(7)).toEqual(["tasks", "detail", 7]);
  });

  it("gives every task its own detail key", () => {
    expect(tasksKeys.detail(1)).not.toEqual(tasksKeys.detail(2));
  });

  it("keeps list and detail keys under the shared 'tasks' prefix (so one invalidation covers both)", () => {
    expect(tasksKeys.list().slice(0, 1)).toEqual(tasksKeys.all);
    expect(tasksKeys.detail(1).slice(0, 1)).toEqual(tasksKeys.all);
  });
});
