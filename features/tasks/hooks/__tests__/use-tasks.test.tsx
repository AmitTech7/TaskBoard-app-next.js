import { act, renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";

import { createQueryTestSetup } from "@/lib/test-utils/query-wrapper";
import { tasksKeys } from "@/lib/queries/query-keys";

import { createTaskAction, deleteTaskAction, updateTaskAction } from "../../api/actions";
import { fetchTask, fetchTasks } from "../../api/client";
import { LOCAL_TASK_ID_START, SIMULATED_WRITE_NOTE } from "../../constants";
import { MOCK_TASKS } from "../../__tests__/_mocks_/mock-data";
import type { Task } from "../../types";
import { useCreateTask, useDeleteTask, useTask, useTasks, useUpdateTask } from "../use-tasks";

jest.mock("../../api/client", () => ({ fetchTasks: jest.fn(), fetchTask: jest.fn() }));
jest.mock("../../api/actions", () => ({
  createTaskAction: jest.fn(),
  updateTaskAction: jest.fn(),
  deleteTaskAction: jest.fn(),
}));
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const ok = <T,>(data: T, statusCode = 200) => ({
  status: true,
  statusCode,
  message: "Success",
  data,
});
const failed = (statusCode: number, message: string) => ({
  status: false,
  statusCode,
  message,
  data: null,
});

const VALUES = { title: "New title", status: "completed" } as const;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("useTasks", () => {
  it("loads every task", async () => {
    jest.mocked(fetchTasks).mockResolvedValue(ok(MOCK_TASKS));
    const { Wrapper } = createQueryTestSetup();

    const { result } = renderHook(() => useTasks(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(MOCK_TASKS);
  });

  it("exposes the failure message as an error", async () => {
    jest.mocked(fetchTasks).mockResolvedValue(failed(500, "Server exploded"));
    const { Wrapper } = createQueryTestSetup();

    const { result } = renderHook(() => useTasks(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Server exploded");
  });

  it("uses data already in the cache (e.g. from the server) without refetching", async () => {
    const { Wrapper, queryClient } = createQueryTestSetup();
    queryClient.setQueryData(tasksKeys.list(), MOCK_TASKS);

    const { result } = renderHook(() => useTasks(), { wrapper: Wrapper });

    expect(result.current.data).toEqual(MOCK_TASKS);
    expect(fetchTasks).not.toHaveBeenCalled();
  });
});

describe("useTask", () => {
  it("starts from the list cache, so edits made in the list show up here (no request)", () => {
    const { Wrapper, queryClient } = createQueryTestSetup();
    queryClient.setQueryData(tasksKeys.list(), MOCK_TASKS);

    const { result } = renderHook(() => useTask(2), { wrapper: Wrapper });

    expect(result.current.data).toEqual(MOCK_TASKS[1]);
    expect(fetchTask).not.toHaveBeenCalled();
  });

  it("fetches the single task when the list is not cached", async () => {
    jest.mocked(fetchTask).mockResolvedValue(ok(MOCK_TASKS[0] as Task));
    const { Wrapper } = createQueryTestSetup();

    const { result } = renderHook(() => useTask(1), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchTask).toHaveBeenCalledWith(1, expect.anything());
    expect(result.current.data).toEqual(MOCK_TASKS[0]);
  });

  it("fetches when the list is cached but does not contain that task", async () => {
    jest
      .mocked(fetchTask)
      .mockResolvedValue(ok({ id: 99, title: "x", status: "pending", userId: 1 } as Task));
    const { Wrapper, queryClient } = createQueryTestSetup();
    queryClient.setQueryData(tasksKeys.list(), MOCK_TASKS);

    const { result } = renderHook(() => useTask(99), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchTask).toHaveBeenCalled();
  });

  it("reports 'not found' as an error", async () => {
    jest.mocked(fetchTask).mockResolvedValue(failed(404, "Todo with id '999' not found"));
    const { Wrapper } = createQueryTestSetup();

    const { result } = renderHook(() => useTask(999), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Todo with id '999' not found");
  });
});

describe("useCreateTask", () => {
  it("adds the new task to the top of the list with a LOCAL id (the API always answers 255)", async () => {
    jest
      .mocked(createTaskAction)
      .mockResolvedValue(
        ok({ id: 255, title: "New title", status: "completed", userId: 1 } as Task, 201),
      );
    const { Wrapper, queryClient } = createQueryTestSetup();
    queryClient.setQueryData(tasksKeys.list(), MOCK_TASKS);
    const { result } = renderHook(() => useCreateTask(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync(VALUES);
    });

    const list = queryClient.getQueryData<Task[]>(tasksKeys.list());

    expect(list).toHaveLength(MOCK_TASKS.length + 1);
    expect(list?.[0]).toEqual({
      id: LOCAL_TASK_ID_START,
      title: "New title",
      status: "completed",
      userId: 1,
    });
  });

  it("gives each new task its own id", async () => {
    jest
      .mocked(createTaskAction)
      .mockResolvedValue(ok({ id: 255, title: "T", status: "pending", userId: 1 } as Task, 201));
    const { Wrapper, queryClient } = createQueryTestSetup();
    queryClient.setQueryData(tasksKeys.list(), MOCK_TASKS);
    const { result } = renderHook(() => useCreateTask(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync(VALUES);
      await result.current.mutateAsync(VALUES);
    });

    const ids = queryClient.getQueryData<Task[]>(tasksKeys.list())?.map((task) => task.id);

    expect(ids?.slice(0, 2)).toEqual([LOCAL_TASK_ID_START + 1, LOCAL_TASK_ID_START]);
  });

  it("shows a success toast that says the change is simulated", async () => {
    jest
      .mocked(createTaskAction)
      .mockResolvedValue(ok({ id: 255, title: "T", status: "pending", userId: 1 } as Task, 201));
    const { Wrapper, queryClient } = createQueryTestSetup();
    queryClient.setQueryData(tasksKeys.list(), MOCK_TASKS);
    const { result } = renderHook(() => useCreateTask(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync(VALUES);
    });

    expect(toast.success).toHaveBeenCalledWith("Task created", {
      description: SIMULATED_WRITE_NOTE,
    });
  });

  it("does not crash when the list is not cached yet", async () => {
    jest
      .mocked(createTaskAction)
      .mockResolvedValue(ok({ id: 255, title: "T", status: "pending", userId: 1 } as Task, 201));
    const { Wrapper, queryClient } = createQueryTestSetup();
    const { result } = renderHook(() => useCreateTask(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync(VALUES);
    });

    expect(queryClient.getQueryData(tasksKeys.list())).toBeUndefined();
    expect(toast.success).toHaveBeenCalled();
  });

  it("shows an error toast and leaves the list alone when the action fails", async () => {
    jest.mocked(createTaskAction).mockResolvedValue(failed(401, "You must be logged in."));
    const { Wrapper, queryClient } = createQueryTestSetup();
    queryClient.setQueryData(tasksKeys.list(), MOCK_TASKS);
    const { result } = renderHook(() => useCreateTask(), { wrapper: Wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync(VALUES)).rejects.toThrow("You must be logged in.");
    });

    expect(toast.error).toHaveBeenCalledWith("You must be logged in.");
    expect(queryClient.getQueryData(tasksKeys.list())).toEqual(MOCK_TASKS);
  });
});

describe("useUpdateTask", () => {
  it("calls the API for a task that exists there, then updates the list AND the detail cache", async () => {
    jest
      .mocked(updateTaskAction)
      .mockResolvedValue(
        ok({ id: 1, title: "New title", status: "completed", userId: 10 } as Task),
      );
    const { Wrapper, queryClient } = createQueryTestSetup();
    queryClient.setQueryData(tasksKeys.list(), MOCK_TASKS);
    queryClient.setQueryData(tasksKeys.detail(1), MOCK_TASKS[0]);
    const { result } = renderHook(() => useUpdateTask(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 1, values: VALUES });
    });

    expect(updateTaskAction).toHaveBeenCalledWith(1, VALUES);
    expect(queryClient.getQueryData<Task[]>(tasksKeys.list())?.[0]).toMatchObject({
      id: 1,
      title: "New title",
      status: "completed",
      userId: 10,
    });
    expect(queryClient.getQueryData<Task>(tasksKeys.detail(1))).toMatchObject({
      title: "New title",
      status: "completed",
    });
  });

  it("only changes the edited task", async () => {
    jest
      .mocked(updateTaskAction)
      .mockResolvedValue(
        ok({ id: 1, title: "New title", status: "completed", userId: 10 } as Task),
      );
    const { Wrapper, queryClient } = createQueryTestSetup();
    queryClient.setQueryData(tasksKeys.list(), MOCK_TASKS);
    const { result } = renderHook(() => useUpdateTask(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 1, values: VALUES });
    });

    expect(queryClient.getQueryData<Task[]>(tasksKeys.list())?.slice(1)).toEqual(
      MOCK_TASKS.slice(1),
    );
  });

  it("SKIPS the API for a task created in this session (it would answer 404)", async () => {
    const localTask: Task = {
      id: LOCAL_TASK_ID_START,
      title: "Mine",
      status: "pending",
      userId: 1,
    };
    const { Wrapper, queryClient } = createQueryTestSetup();
    queryClient.setQueryData(tasksKeys.list(), [localTask, ...MOCK_TASKS]);
    const { result } = renderHook(() => useUpdateTask(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: LOCAL_TASK_ID_START, values: VALUES });
    });

    expect(updateTaskAction).not.toHaveBeenCalled();
    expect(queryClient.getQueryData<Task[]>(tasksKeys.list())?.[0]).toMatchObject({
      id: LOCAL_TASK_ID_START,
      title: "New title",
      status: "completed",
    });
    expect(toast.success).toHaveBeenCalledWith("Task updated", {
      description: SIMULATED_WRITE_NOTE,
    });
  });

  it("does not crash when the detail or list is not cached", async () => {
    jest
      .mocked(updateTaskAction)
      .mockResolvedValue(
        ok({ id: 1, title: "New title", status: "completed", userId: 10 } as Task),
      );
    const { Wrapper, queryClient } = createQueryTestSetup();
    const { result } = renderHook(() => useUpdateTask(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 1, values: VALUES });
    });

    expect(queryClient.getQueryData(tasksKeys.list())).toBeUndefined();
    expect(queryClient.getQueryData(tasksKeys.detail(1))).toBeUndefined();
  });

  it("shows an error toast and leaves the cache alone when the action fails", async () => {
    jest.mocked(updateTaskAction).mockResolvedValue(failed(404, "Todo with id '1' not found"));
    const { Wrapper, queryClient } = createQueryTestSetup();
    queryClient.setQueryData(tasksKeys.list(), MOCK_TASKS);
    const { result } = renderHook(() => useUpdateTask(), { wrapper: Wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync({ id: 1, values: VALUES })).rejects.toThrow();
    });

    expect(toast.error).toHaveBeenCalledWith("Todo with id '1' not found");
    expect(queryClient.getQueryData(tasksKeys.list())).toEqual(MOCK_TASKS);
  });
});

describe("useDeleteTask", () => {
  it("calls the API for a task that exists there, then removes it from the list", async () => {
    jest.mocked(deleteTaskAction).mockResolvedValue(ok(MOCK_TASKS[0] as Task));
    const { Wrapper, queryClient } = createQueryTestSetup();
    queryClient.setQueryData(tasksKeys.list(), MOCK_TASKS);
    const { result } = renderHook(() => useDeleteTask(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync(1);
    });

    expect(deleteTaskAction).toHaveBeenCalledWith(1);
    expect(queryClient.getQueryData<Task[]>(tasksKeys.list())?.map((task) => task.id)).toEqual([
      2, 3, 4,
    ]);
    expect(toast.success).toHaveBeenCalledWith("Task deleted", {
      description: SIMULATED_WRITE_NOTE,
    });
  });

  it("also forgets that task's detail cache", async () => {
    jest.mocked(deleteTaskAction).mockResolvedValue(ok(MOCK_TASKS[0] as Task));
    const { Wrapper, queryClient } = createQueryTestSetup();
    queryClient.setQueryData(tasksKeys.list(), MOCK_TASKS);
    queryClient.setQueryData(tasksKeys.detail(1), MOCK_TASKS[0]);
    queryClient.setQueryData(tasksKeys.detail(2), MOCK_TASKS[1]);
    const { result } = renderHook(() => useDeleteTask(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync(1);
    });

    expect(queryClient.getQueryData(tasksKeys.detail(1))).toBeUndefined();
    expect(queryClient.getQueryData(tasksKeys.detail(2))).toEqual(MOCK_TASKS[1]);
  });

  it("SKIPS the API for a task created in this session (it would answer 404)", async () => {
    const localTask: Task = {
      id: LOCAL_TASK_ID_START,
      title: "Mine",
      status: "pending",
      userId: 1,
    };
    const { Wrapper, queryClient } = createQueryTestSetup();
    queryClient.setQueryData(tasksKeys.list(), [localTask, ...MOCK_TASKS]);
    const { result } = renderHook(() => useDeleteTask(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync(LOCAL_TASK_ID_START);
    });

    expect(deleteTaskAction).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(tasksKeys.list())).toEqual(MOCK_TASKS);
  });

  it("does not crash when the list is not cached", async () => {
    jest.mocked(deleteTaskAction).mockResolvedValue(ok(MOCK_TASKS[0] as Task));
    const { Wrapper, queryClient } = createQueryTestSetup();
    const { result } = renderHook(() => useDeleteTask(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync(1);
    });

    expect(queryClient.getQueryData(tasksKeys.list())).toBeUndefined();
  });

  it("shows an error toast and keeps the task when the action fails", async () => {
    jest.mocked(deleteTaskAction).mockResolvedValue(failed(500, "Could not delete the task."));
    const { Wrapper, queryClient } = createQueryTestSetup();
    queryClient.setQueryData(tasksKeys.list(), MOCK_TASKS);
    const { result } = renderHook(() => useDeleteTask(), { wrapper: Wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync(1)).rejects.toThrow();
    });

    expect(toast.error).toHaveBeenCalledWith("Could not delete the task.");
    expect(queryClient.getQueryData(tasksKeys.list())).toEqual(MOCK_TASKS);
  });
});
