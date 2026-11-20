import { buildTaskDetailHref, buildTasksListHref, getBackHref } from "../task-url";

describe("buildTasksListHref", () => {
  it("is just /tasks when every value is the default", () => {
    expect(buildTasksListHref({ search: "", status: "", page: 1 })).toBe("/tasks");
  });

  it("includes only the values that are set", () => {
    expect(buildTasksListHref({ search: "milk", status: "", page: 1 })).toBe("/tasks?q=milk");
    expect(buildTasksListHref({ search: "", status: "pending", page: 1 })).toBe(
      "/tasks?status=pending",
    );
    expect(buildTasksListHref({ search: "", status: "", page: 3 })).toBe("/tasks?page=3");
  });

  it("includes everything together", () => {
    expect(buildTasksListHref({ search: "milk", status: "completed", page: 2 })).toBe(
      "/tasks?q=milk&status=completed&page=2",
    );
  });

  it("encodes special characters in the search", () => {
    expect(buildTasksListHref({ search: "a&b=c d", status: "", page: 1 })).toBe(
      "/tasks?q=a%26b%3Dc+d",
    );
  });
});

describe("buildTaskDetailHref", () => {
  it("adds the list URL as an encoded ?from= value", () => {
    expect(buildTaskDetailHref(12, "/tasks?q=milk&page=2")).toBe(
      "/tasks/12?from=%2Ftasks%3Fq%3Dmilk%26page%3D2",
    );
  });
});

describe("getBackHref", () => {
  it("returns the saved list URL when it is safe", () => {
    expect(getBackHref("/tasks?q=milk&page=2")).toBe("/tasks?q=milk&page=2");
  });

  it.each([null, undefined, "", "//evil.com", "https://evil.com", "/\\evil.com"])(
    "falls back to /tasks for %p",
    (from) => {
      expect(getBackHref(from)).toBe("/tasks");
    },
  );

  it("round-trips with buildTaskDetailHref", () => {
    const listHref = buildTasksListHref({ search: "100%", status: "pending", page: 2 });
    const detailHref = buildTaskDetailHref(7, listHref);
    // What `useSearchParams().get("from")` would give back (it decodes once).
    const from = new URL(detailHref, "http://localhost").searchParams.get("from");

    expect(getBackHref(from)).toBe(listHref);
  });
});
