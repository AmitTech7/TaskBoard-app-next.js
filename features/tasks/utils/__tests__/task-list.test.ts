import { LOCAL_TASK_ID_START } from "../../constants";
import { buildManyTasks, MOCK_TASKS } from "../../__tests__/_mocks_/mock-data";
import {
  filterTasks,
  getNextLocalTaskId,
  getTaskCounts,
  isLocalTaskId,
  paginateTasks,
} from "../task-list";

describe("filterTasks", () => {
  it("returns every task when there is no search and no status", () => {
    expect(filterTasks(MOCK_TASKS, { search: "", status: "" })).toEqual(MOCK_TASKS);
  });

  it("filters by status", () => {
    const result = filterTasks(MOCK_TASKS, { search: "", status: "completed" });

    expect(result.map((task) => task.id)).toEqual([2, 4]);
  });

  it("searches the title, ignoring upper/lower case", () => {
    const result = filterTasks(MOCK_TASKS, { search: "LEARN", status: "" });

    expect(result.map((task) => task.id)).toEqual([2, 3]);
  });

  it("ignores spaces around the search text", () => {
    expect(filterTasks(MOCK_TASKS, { search: "  milk  ", status: "" })).toHaveLength(1);
  });

  it("combines search and status (both must match)", () => {
    const result = filterTasks(MOCK_TASKS, { search: "learn", status: "pending" });

    expect(result.map((task) => task.id)).toEqual([3]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterTasks(MOCK_TASKS, { search: "zzz", status: "" })).toEqual([]);
  });

  it("does not change the list it was given", () => {
    const copy = [...MOCK_TASKS];

    filterTasks(MOCK_TASKS, { search: "milk", status: "pending" });

    expect(MOCK_TASKS).toEqual(copy);
  });
});

describe("paginateTasks", () => {
  const tasks = buildManyTasks(25);

  it("returns the first page", () => {
    const page = paginateTasks(tasks, 1, 10);

    expect(page.items.map((task) => task.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(page).toMatchObject({ total: 25, page: 1, pageCount: 3 });
  });

  it("returns a partial last page", () => {
    const page = paginateTasks(tasks, 3, 10);

    expect(page.items).toHaveLength(5);
    expect(page.page).toBe(3);
  });

  it("clamps a page past the end to the last page", () => {
    expect(paginateTasks(tasks, 99, 10).page).toBe(3);
  });

  it.each([0, -5])("clamps page %p up to page 1", (page) => {
    expect(paginateTasks(tasks, page, 10).page).toBe(1);
  });

  it("has one (empty) page when there are no tasks", () => {
    expect(paginateTasks([], 1, 10)).toEqual({ items: [], total: 0, page: 1, pageCount: 1 });
  });

  it("fits an exact multiple of the page size into whole pages", () => {
    expect(paginateTasks(buildManyTasks(20), 1, 10).pageCount).toBe(2);
  });
});

describe("getTaskCounts", () => {
  it("counts total, completed and pending", () => {
    expect(getTaskCounts(MOCK_TASKS)).toEqual({ total: 4, completed: 2, pending: 2 });
  });

  it("returns zeros for an empty list", () => {
    expect(getTaskCounts([])).toEqual({ total: 0, completed: 0, pending: 0 });
  });
});

describe("local task ids", () => {
  it("treats ids from LOCAL_TASK_ID_START up as local", () => {
    expect(isLocalTaskId(LOCAL_TASK_ID_START)).toBe(true);
    expect(isLocalTaskId(LOCAL_TASK_ID_START + 5)).toBe(true);
    expect(isLocalTaskId(LOCAL_TASK_ID_START - 1)).toBe(false);
    expect(isLocalTaskId(1)).toBe(false);
  });

  it("starts numbering at LOCAL_TASK_ID_START when there are no local tasks", () => {
    expect(getNextLocalTaskId(MOCK_TASKS)).toBe(LOCAL_TASK_ID_START);
    expect(getNextLocalTaskId([])).toBe(LOCAL_TASK_ID_START);
  });

  it("continues after the highest local id, ignoring remote ids", () => {
    const tasks = [
      ...MOCK_TASKS,
      { id: LOCAL_TASK_ID_START, title: "a", status: "pending" as const, userId: 1 },
      { id: LOCAL_TASK_ID_START + 3, title: "b", status: "pending" as const, userId: 1 },
    ];

    expect(getNextLocalTaskId(tasks)).toBe(LOCAL_TASK_ID_START + 4);
  });
});
