export type TaskStatus = "pending" | "completed";

/** The task shape the whole app uses (DummyJSON's `todo`/`completed` are mapped into this). */
export interface Task {
  id: number;
  title: string;
  status: TaskStatus;
  userId: number;
}

/** What the list page keeps in the URL: `/tasks?q=milk&status=pending&page=2`. */
export interface TaskListParams {
  search: string;
  /** "" means "all statuses" (a cleared filter is an empty string, never null). */
  status: TaskStatus | "";
  page: number;
}

export interface TaskPage {
  items: Task[];
  /** How many tasks match the filters (before paging). */
  total: number;
  page: number;
  pageCount: number;
}

export interface TaskCounts {
  total: number;
  completed: number;
  pending: number;
}

/** Fields an update changes (what edit mutations hand back to the cache). */
export type TaskPatch = Pick<Task, "id" | "title" | "status">;

/** What DummyJSON returns for one todo. */
export interface RemoteTodo {
  id: number;
  todo: string;
  completed: boolean;
  userId: number;
}

/** What DummyJSON returns for GET /todos. */
export interface RemoteTodosResponse {
  todos: RemoteTodo[];
  total: number;
  skip: number;
  limit: number;
}
