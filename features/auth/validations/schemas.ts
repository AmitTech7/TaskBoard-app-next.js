import { z } from "zod";

import { MAX_INPUT_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/constants/validation";

/** All login rules live here (never as HTML attributes like `required` or `minLength`). */
export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Username is required")
    .max(MAX_INPUT_LENGTH, `Username must be at most ${MAX_INPUT_LENGTH} characters`),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
    .max(MAX_INPUT_LENGTH, `Password must be at most ${MAX_INPUT_LENGTH} characters`),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
