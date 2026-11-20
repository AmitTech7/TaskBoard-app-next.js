import type { RemoteTodo, RemoteTodosResponse, Task } from "../types";
import type { TaskFormValues } from "../validations/schemas";

/** DummyJSON todo -> our Task (`todo` becomes `title`, `completed` becomes a status). */
export function mapRemoteTodo(remote: RemoteTodo): Task {
  return {
    id: remote.id,
    title: remote.todo,
    status: remote.completed ? "completed" : "pending",
    userId: remote.userId,
  };
}

export function mapRemoteTodos(response: RemoteTodosResponse): Task[] {
  return response.todos.map(mapRemoteTodo);
}

/** Our form values -> the body DummyJSON expects. */
export function toRemoteTodoBody(values: TaskFormValues): Pick<RemoteTodo, "todo" | "completed"> {
  return {
    todo: values.title,
    completed: values.status === "completed",
  };
}
