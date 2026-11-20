import { z } from "zod";

import { MAX_INPUT_LENGTH } from "@/lib/constants/validation";

import { TASK_STATUS_VALUES } from "../constants";
import type { TaskListParams } from "../types";

/** The create/edit form. All rules live here (no HTML `required`/`maxLength` on inputs). */
export const taskFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(MAX_INPUT_LENGTH, `Title must be at most ${MAX_INPUT_LENGTH} characters`),
  status: z.enum(TASK_STATUS_VALUES, { error: "Please select a status" }),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

/**
 * The list URL is typed by users and shared as a link, so it can contain anything.
 * `.catch()` turns every invalid value into a safe default instead of an error.
 */
export const taskListParamsSchema = z.object({
  search: z.string().trim().max(MAX_INPUT_LENGTH).catch(""),
  status: z.union([z.literal(""), z.enum(TASK_STATUS_VALUES)]).catch(""),
  page: z.coerce.number().int().min(1).catch(1),
});

/** Anything with `.get(name)`: `URLSearchParams`, or what `useSearchParams()` returns. */
export interface SearchParamsReader {
  get: (name: string) => string | null;
}

export function parseTaskListParams(reader: SearchParamsReader): TaskListParams {
  return taskListParamsSchema.parse({
    search: reader.get("q") ?? "",
    status: reader.get("status") ?? "",
    page: reader.get("page") ?? undefined,
  });
}
