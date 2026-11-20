import type { ComboboxOption } from "@/components/ui/combobox";

import type { TaskStatus } from "../types";

export const TASK_STATUS_VALUES = ["pending", "completed"] as const satisfies readonly TaskStatus[];

/** What the user SEES. Never render the raw enum value ("pending") in the UI. */
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "Pending",
  completed: "Completed",
};

/** Options for the status Combobox (form and list filter). */
export const TASK_STATUS_OPTIONS: ComboboxOption[] = TASK_STATUS_VALUES.map((status) => ({
  value: status,
  label: TASK_STATUS_LABELS[status],
}));

export const DEFAULT_TASK_STATUS: TaskStatus = "pending";

export const TASK_PAGE_SIZE = 10;

/** How long typing must pause before the search is written to the URL. */
export const SEARCH_DEBOUNCE_MS = 300;

/** DummyJSON returns every record when `limit=0`. We fetch once, then search/filter locally. */
export const ALL_RECORDS_LIMIT = 0;

/** Names of the URL query parameters. */
export const TASK_QUERY_PARAMS = {
  SEARCH: "q",
  STATUS: "status",
  PAGE: "page",
  /** Where the detail page's Back button returns to (the list URL incl. its filters). */
  FROM: "from",
} as const;

/**
 * The demo API saves nothing, and it 404s when you edit a task it never stored. Tasks created in
 * this session get ids from here up and live only in the browser cache.
 */
export const LOCAL_TASK_ID_START = 10_000;

export const SIMULATED_WRITE_NOTE = "Demo API: changes are simulated and not saved on the server.";
