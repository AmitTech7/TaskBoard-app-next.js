import {
  MOCK_REMOTE_TODOS,
  MOCK_REMOTE_TODOS_RESPONSE,
  MOCK_TASKS,
} from "../../__tests__/_mocks_/mock-data";
import { mapRemoteTodo, mapRemoteTodos, toRemoteTodoBody } from "../mappers";

describe("mapRemoteTodo", () => {
  it("renames `todo` to `title`", () => {
    expect(mapRemoteTodo({ id: 1, todo: "Buy milk", completed: false, userId: 5 }).title).toBe(
      "Buy milk",
    );
  });

  it("turns completed:true into status 'completed'", () => {
    expect(mapRemoteTodo({ id: 1, todo: "x", completed: true, userId: 5 }).status).toBe(
      "completed",
    );
  });

  it("turns completed:false into status 'pending'", () => {
    expect(mapRemoteTodo({ id: 1, todo: "x", completed: false, userId: 5 }).status).toBe("pending");
  });

  it("keeps id and userId and drops fields we don't use", () => {
    const remote = { id: 9, todo: "x", completed: false, userId: 5, isDeleted: true };

    expect(mapRemoteTodo(remote)).toEqual({ id: 9, title: "x", status: "pending", userId: 5 });
  });
});

describe("mapRemoteTodos", () => {
  it("maps the whole response", () => {
    expect(mapRemoteTodos(MOCK_REMOTE_TODOS_RESPONSE)).toEqual(MOCK_TASKS);
  });

  it("handles an empty list", () => {
    expect(mapRemoteTodos({ todos: [], total: 0, skip: 0, limit: 0 })).toEqual([]);
  });

  it("keeps the original order", () => {
    expect(mapRemoteTodos(MOCK_REMOTE_TODOS_RESPONSE).map((task) => task.id)).toEqual(
      MOCK_REMOTE_TODOS.map((todo) => todo.id),
    );
  });
});

describe("toRemoteTodoBody", () => {
  it("turns a completed task into { todo, completed: true }", () => {
    expect(toRemoteTodoBody({ title: "Buy milk", status: "completed" })).toEqual({
      todo: "Buy milk",
      completed: true,
    });
  });

  it("turns a pending task into { todo, completed: false }", () => {
    expect(toRemoteTodoBody({ title: "Buy milk", status: "pending" })).toEqual({
      todo: "Buy milk",
      completed: false,
    });
  });
});
