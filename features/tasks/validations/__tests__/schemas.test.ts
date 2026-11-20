import { MAX_INPUT_LENGTH } from "@/lib/constants/validation";

import { parseTaskListParams, taskFormSchema, taskListParamsSchema } from "../schemas";

function reader(values: Record<string, string>) {
  return { get: (name: string) => values[name] ?? null };
}

describe("taskFormSchema", () => {
  it("accepts a valid task", () => {
    const result = taskFormSchema.safeParse({ title: "Buy milk", status: "pending" });

    expect(result.success).toBe(true);
  });

  it("trims the title", () => {
    const result = taskFormSchema.parse({ title: "  Buy milk  ", status: "completed" });

    expect(result.title).toBe("Buy milk");
  });

  it.each(["", "    "])("rejects an empty or blank title (%p)", (title) => {
    const result = taskFormSchema.safeParse({ title, status: "pending" });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Title is required");
  });

  it("accepts a title of exactly the maximum length", () => {
    const result = taskFormSchema.safeParse({
      title: "a".repeat(MAX_INPUT_LENGTH),
      status: "pending",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a title over the maximum length", () => {
    const result = taskFormSchema.safeParse({
      title: "a".repeat(MAX_INPUT_LENGTH + 1),
      status: "pending",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain(String(MAX_INPUT_LENGTH));
  });

  it.each(["", "done", undefined])(
    "rejects an invalid status (%p) with a friendly message",
    (status) => {
      const result = taskFormSchema.safeParse({ title: "Buy milk", status });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe("Please select a status");
    },
  );
});

describe("taskListParamsSchema", () => {
  it("accepts valid values", () => {
    expect(taskListParamsSchema.parse({ search: "milk", status: "pending", page: "3" })).toEqual({
      search: "milk",
      status: "pending",
      page: 3,
    });
  });

  it("falls back to defaults instead of throwing", () => {
    expect(taskListParamsSchema.parse({ search: 5, status: "junk", page: "abc" })).toEqual({
      search: "",
      status: "",
      page: 1,
    });
  });

  it.each(["0", "-2", "1.5", "NaN"])("falls back to page 1 for page=%p", (page) => {
    expect(taskListParamsSchema.parse({ search: "", status: "", page }).page).toBe(1);
  });

  it("falls back to an empty search when it is too long", () => {
    const result = taskListParamsSchema.parse({
      search: "a".repeat(MAX_INPUT_LENGTH + 1),
      status: "",
      page: 1,
    });

    expect(result.search).toBe("");
  });

  it("trims the search text", () => {
    expect(taskListParamsSchema.parse({ search: "  milk ", status: "", page: 1 }).search).toBe(
      "milk",
    );
  });
});

describe("parseTaskListParams", () => {
  it("reads q, status and page from the URL", () => {
    expect(parseTaskListParams(reader({ q: "milk", status: "completed", page: "2" }))).toEqual({
      search: "milk",
      status: "completed",
      page: 2,
    });
  });

  it("uses defaults for a URL with no parameters", () => {
    expect(parseTaskListParams(reader({}))).toEqual({ search: "", status: "", page: 1 });
  });

  it("works with a real URLSearchParams", () => {
    const params = new URLSearchParams("q=milk&page=4&status=nope");

    expect(parseTaskListParams(params)).toEqual({ search: "milk", status: "", page: 4 });
  });
});
