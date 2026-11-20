import { apiClient } from "@/lib/api/client";

import {
  MOCK_REMOTE_TODOS,
  MOCK_REMOTE_TODOS_RESPONSE,
  MOCK_TASKS,
} from "../../__tests__/_mocks_/mock-data";
import { fetchTask, fetchTasks } from "../client";

jest.mock("@/lib/api/client", () => ({ apiClient: { get: jest.fn() } }));

beforeEach(() => {
  jest.mocked(apiClient.get).mockReset();
});

describe("fetchTasks", () => {
  it("asks for ALL todos (limit=0) so filtering can happen locally", async () => {
    jest.mocked(apiClient.get).mockResolvedValue({
      status: true,
      statusCode: 200,
      message: "Success",
      data: MOCK_REMOTE_TODOS_RESPONSE,
    });

    await fetchTasks();

    expect(apiClient.get).toHaveBeenCalledWith("/todos", {
      params: { limit: 0 },
      signal: undefined,
    });
  });

  it("returns the todos mapped to Tasks", async () => {
    jest.mocked(apiClient.get).mockResolvedValue({
      status: true,
      statusCode: 200,
      message: "Success",
      data: MOCK_REMOTE_TODOS_RESPONSE,
    });

    const result = await fetchTasks();

    expect(result).toMatchObject({ status: true, data: MOCK_TASKS });
  });

  it("passes the abort signal along", async () => {
    jest.mocked(apiClient.get).mockResolvedValue({
      status: true,
      statusCode: 200,
      message: "Success",
      data: MOCK_REMOTE_TODOS_RESPONSE,
    });
    const controller = new AbortController();

    await fetchTasks(controller.signal);

    expect(apiClient.get).toHaveBeenCalledWith(
      "/todos",
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it("passes a failure through", async () => {
    const failed = { status: false, statusCode: 500, message: "Boom", data: null };
    jest.mocked(apiClient.get).mockResolvedValue(failed);

    expect(await fetchTasks()).toEqual(failed);
  });
});

describe("fetchTask", () => {
  it("GETs one todo by id and maps it", async () => {
    jest.mocked(apiClient.get).mockResolvedValue({
      status: true,
      statusCode: 200,
      message: "Success",
      data: MOCK_REMOTE_TODOS[1],
    });

    const result = await fetchTask(2);

    expect(apiClient.get).toHaveBeenCalledWith("/todos/2", { signal: undefined });
    expect(result.data).toEqual(MOCK_TASKS[1]);
  });

  it("passes a 404 through", async () => {
    const notFound = { status: false, statusCode: 404, message: "Not found", data: null };
    jest.mocked(apiClient.get).mockResolvedValue(notFound);

    expect(await fetchTask(999)).toEqual(notFound);
  });
});
