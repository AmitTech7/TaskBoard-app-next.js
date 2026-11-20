import { getCurrentUser } from "@/features/auth/api/server";
import { fetchServer } from "@/lib/api/server";

import { MOCK_REMOTE_TODOS, MOCK_USER } from "../../__tests__/_mocks_/mock-data";
import { createTaskAction, deleteTaskAction, updateTaskAction } from "../actions";

jest.mock("@/features/auth/api/server", () => ({ getCurrentUser: jest.fn() }));
jest.mock("@/lib/api/server", () => ({ fetchServer: jest.fn() }));
jest.mock("@/lib/logger", () => ({
  logger: () => ({ debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() }),
}));

const NOT_LOGGED_IN = {
  status: false,
  statusCode: 401,
  message: "You must be logged in.",
  data: null,
};
const VALID_VALUES = { title: "Buy milk", status: "pending" } as const;

function apiSucceeds(data: unknown, statusCode = 200) {
  jest
    .mocked(fetchServer)
    .mockResolvedValue({ status: true, statusCode, message: "Success", data });
}

function apiFails(statusCode: number, message: string) {
  jest.mocked(fetchServer).mockResolvedValue({ status: false, statusCode, message, data: null });
}

beforeEach(() => {
  jest.mocked(fetchServer).mockReset();
  jest.mocked(getCurrentUser).mockReset().mockResolvedValue(MOCK_USER);
});

describe("createTaskAction", () => {
  it("POSTs the task with the logged-in user's id", async () => {
    apiSucceeds({ id: 255, todo: "Buy milk", completed: false, userId: MOCK_USER.id }, 201);

    await createTaskAction(VALID_VALUES);

    expect(fetchServer).toHaveBeenCalledWith("/todos/add", {
      method: "POST",
      body: { todo: "Buy milk", completed: false, userId: MOCK_USER.id },
    });
  });

  it("returns the created task mapped to our Task shape", async () => {
    apiSucceeds({ id: 255, todo: "Buy milk", completed: false, userId: 1 }, 201);

    expect(await createTaskAction(VALID_VALUES)).toMatchObject({
      status: true,
      statusCode: 201,
      data: { id: 255, title: "Buy milk", status: "pending", userId: 1 },
    });
  });

  it("maps 'completed' to completed:true in the request", async () => {
    apiSucceeds({ id: 255, todo: "x", completed: true, userId: 1 }, 201);

    await createTaskAction({ title: "x", status: "completed" });

    expect(jest.mocked(fetchServer).mock.calls[0]?.[1]).toMatchObject({
      body: { completed: true },
    });
  });

  it("refuses when nobody is logged in, without calling the API", async () => {
    jest.mocked(getCurrentUser).mockResolvedValue(null);

    expect(await createTaskAction(VALID_VALUES)).toEqual(NOT_LOGGED_IN);
    expect(fetchServer).not.toHaveBeenCalled();
  });

  it("re-validates the input on the server (a caller can skip the form)", async () => {
    const result = await createTaskAction({ title: "   ", status: "pending" });

    expect(result).toMatchObject({
      status: false,
      statusCode: 400,
      message: ["Title is required"],
    });
    expect(fetchServer).not.toHaveBeenCalled();
  });

  it("rejects an invalid status", async () => {
    const result = await createTaskAction({ title: "x", status: "hacked" as "pending" });

    expect(result).toMatchObject({ status: false, statusCode: 400 });
    expect(fetchServer).not.toHaveBeenCalled();
  });

  it("returns an API failure as a result", async () => {
    apiFails(500, "Server exploded");

    expect(await createTaskAction(VALID_VALUES)).toMatchObject({
      status: false,
      statusCode: 500,
      message: "Server exploded",
      data: null,
    });
  });

  it("never throws: an unexpected error becomes a failed result", async () => {
    jest.mocked(fetchServer).mockRejectedValue(new Error("kaboom"));

    expect(await createTaskAction(VALID_VALUES)).toEqual({
      status: false,
      statusCode: 500,
      message: "Could not create the task.",
      data: null,
    });
  });

  it("never throws even when checking the session fails", async () => {
    jest.mocked(getCurrentUser).mockRejectedValue(new Error("cookies unavailable"));

    expect(await createTaskAction(VALID_VALUES)).toMatchObject({ status: false, statusCode: 500 });
  });
});

describe("updateTaskAction", () => {
  it("PUTs the new values to the task's URL", async () => {
    apiSucceeds({ id: 1, todo: "Edited", completed: true, userId: 10 });

    await updateTaskAction(1, { title: "Edited", status: "completed" });

    expect(fetchServer).toHaveBeenCalledWith("/todos/1", {
      method: "PUT",
      body: { todo: "Edited", completed: true },
    });
  });

  it("returns the updated task mapped to our Task shape", async () => {
    apiSucceeds({ id: 1, todo: "Edited", completed: true, userId: 10 });

    expect((await updateTaskAction(1, { title: "Edited", status: "completed" })).data).toEqual({
      id: 1,
      title: "Edited",
      status: "completed",
      userId: 10,
    });
  });

  it("refuses when nobody is logged in", async () => {
    jest.mocked(getCurrentUser).mockResolvedValue(null);

    expect(await updateTaskAction(1, VALID_VALUES)).toEqual(NOT_LOGGED_IN);
    expect(fetchServer).not.toHaveBeenCalled();
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects the invalid id %p",
    async (id) => {
      expect(await updateTaskAction(id, VALID_VALUES)).toMatchObject({
        status: false,
        statusCode: 400,
        message: "Invalid task id.",
      });
      expect(fetchServer).not.toHaveBeenCalled();
    },
  );

  it("rejects invalid values", async () => {
    expect(await updateTaskAction(1, { title: "", status: "pending" })).toMatchObject({
      status: false,
      statusCode: 400,
    });
    expect(fetchServer).not.toHaveBeenCalled();
  });

  it("passes the API's 404 through", async () => {
    apiFails(404, "Todo with id '99999' not found");

    expect(await updateTaskAction(99999, VALID_VALUES)).toMatchObject({
      status: false,
      statusCode: 404,
      message: "Todo with id '99999' not found",
    });
  });

  it("never throws", async () => {
    jest.mocked(fetchServer).mockRejectedValue(new Error("kaboom"));

    expect(await updateTaskAction(1, VALID_VALUES)).toMatchObject({
      status: false,
      message: "Could not update the task.",
    });
  });
});

describe("deleteTaskAction", () => {
  it("sends DELETE to the task's URL", async () => {
    apiSucceeds({ ...MOCK_REMOTE_TODOS[0], isDeleted: true });

    await deleteTaskAction(1);

    expect(fetchServer).toHaveBeenCalledWith("/todos/1", { method: "DELETE" });
  });

  it("returns the deleted task mapped to our Task shape", async () => {
    apiSucceeds({ ...MOCK_REMOTE_TODOS[0], isDeleted: true, deletedOn: "2026-11-20" });

    expect((await deleteTaskAction(1)).data).toEqual({
      id: 1,
      title: "Buy milk",
      status: "pending",
      userId: 10,
    });
  });

  it("refuses when nobody is logged in", async () => {
    jest.mocked(getCurrentUser).mockResolvedValue(null);

    expect(await deleteTaskAction(1)).toEqual(NOT_LOGGED_IN);
    expect(fetchServer).not.toHaveBeenCalled();
  });

  it.each([0, -3, 2.5])("rejects the invalid id %p", async (id) => {
    expect(await deleteTaskAction(id)).toMatchObject({ status: false, statusCode: 400 });
    expect(fetchServer).not.toHaveBeenCalled();
  });

  it("passes the API's 404 through", async () => {
    apiFails(404, "Todo with id '99999' not found");

    expect(await deleteTaskAction(99999)).toMatchObject({ status: false, statusCode: 404 });
  });

  it("never throws", async () => {
    jest.mocked(fetchServer).mockRejectedValue(new Error("kaboom"));

    expect(await deleteTaskAction(1)).toMatchObject({
      status: false,
      message: "Could not delete the task.",
    });
  });
});
