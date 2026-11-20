import { fetchServer } from "@/lib/api/server";

import {
  MOCK_REMOTE_TODOS,
  MOCK_REMOTE_TODOS_RESPONSE,
  MOCK_TASKS,
} from "../../__tests__/_mocks_/mock-data";
import { getTask, getTasks } from "../server";

jest.mock("@/lib/api/server", () => ({ fetchServer: jest.fn() }));

beforeEach(() => {
  jest.mocked(fetchServer).mockReset();
});

describe("getTasks", () => {
  it("asks for ALL todos (limit=0) so filtering can happen locally", async () => {
    jest.mocked(fetchServer).mockResolvedValue({
      status: true,
      statusCode: 200,
      message: "Success",
      data: MOCK_REMOTE_TODOS_RESPONSE,
    });

    await getTasks();

    expect(fetchServer).toHaveBeenCalledWith("/todos", { params: { limit: 0 } });
  });

  it("returns the todos mapped to Tasks", async () => {
    jest.mocked(fetchServer).mockResolvedValue({
      status: true,
      statusCode: 200,
      message: "Success",
      data: MOCK_REMOTE_TODOS_RESPONSE,
    });

    expect((await getTasks()).data).toEqual(MOCK_TASKS);
  });

  it("passes a failure through", async () => {
    const failed = { status: false, statusCode: 0, message: "Network error", data: null };
    jest.mocked(fetchServer).mockResolvedValue(failed);

    expect(await getTasks()).toEqual(failed);
  });
});

describe("getTask", () => {
  it("GETs one todo by id and maps it", async () => {
    jest.mocked(fetchServer).mockResolvedValue({
      status: true,
      statusCode: 200,
      message: "Success",
      data: MOCK_REMOTE_TODOS[2],
    });

    const result = await getTask(3);

    expect(fetchServer).toHaveBeenCalledWith("/todos/3");
    expect(result.data).toEqual(MOCK_TASKS[2]);
  });

  it("passes a 404 through", async () => {
    const notFound = { status: false, statusCode: 404, message: "Not found", data: null };
    jest.mocked(fetchServer).mockResolvedValue(notFound);

    expect(await getTask(999)).toEqual(notFound);
  });
});
