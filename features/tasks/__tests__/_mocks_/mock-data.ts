import type { RemoteTodo, RemoteTodosResponse, Task } from "../../types";

/** Shared fake data for the tasks tests (and the auth tests that need a user). */

export const MOCK_REMOTE_TODOS: RemoteTodo[] = [
  { id: 1, todo: "Buy milk", completed: false, userId: 10 },
  { id: 2, todo: "Learn Next.js", completed: true, userId: 10 },
  { id: 3, todo: "Learn testing", completed: false, userId: 11 },
  { id: 4, todo: "Walk the dog", completed: true, userId: 12 },
];

export const MOCK_REMOTE_TODOS_RESPONSE: RemoteTodosResponse = {
  todos: MOCK_REMOTE_TODOS,
  total: MOCK_REMOTE_TODOS.length,
  skip: 0,
  limit: 0,
};

/** The same four todos, already mapped to our `Task` shape. */
export const MOCK_TASKS: Task[] = [
  { id: 1, title: "Buy milk", status: "pending", userId: 10 },
  { id: 2, title: "Learn Next.js", status: "completed", userId: 10 },
  { id: 3, title: "Learn testing", status: "pending", userId: 11 },
  { id: 4, title: "Walk the dog", status: "completed", userId: 12 },
];

export const MOCK_USER = {
  id: 1,
  username: "emilys",
  email: "emily@example.com",
  firstName: "Emily",
  lastName: "Johnson",
  image: "https://example.com/emily.png",
};

/** What DummyJSON really returns for /auth/me: extra fields, including a plaintext password. */
export const MOCK_REMOTE_USER = {
  ...MOCK_USER,
  password: "emilyspass",
  age: 29,
};

/** Builds `count` tasks so paging tests don't need to type them out. */
export function buildManyTasks(count: number): Task[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    title: `Task ${index + 1}`,
    status: index % 2 === 0 ? ("pending" as const) : ("completed" as const),
    userId: 1,
  }));
}
