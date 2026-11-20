import { MAX_INPUT_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/constants/validation";

import { loginSchema } from "../schemas";

describe("loginSchema", () => {
  it("accepts a valid login", () => {
    expect(loginSchema.safeParse({ username: "emilys", password: "emilyspass" }).success).toBe(
      true,
    );
  });

  it("trims the username but never the password", () => {
    const result = loginSchema.parse({ username: "  emilys  ", password: "  pass word  " });

    expect(result.username).toBe("emilys");
    expect(result.password).toBe("  pass word  ");
  });

  it.each(["", "   "])("requires a username (%p)", (username) => {
    const result = loginSchema.safeParse({ username, password: "emilyspass" });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Username is required");
  });

  it("rejects a username over the maximum length", () => {
    const result = loginSchema.safeParse({
      username: "u".repeat(MAX_INPUT_LENGTH + 1),
      password: "emilyspass",
    });

    expect(result.success).toBe(false);
  });

  it("accepts a password of exactly the minimum length", () => {
    const result = loginSchema.safeParse({
      username: "emilys",
      password: "p".repeat(MIN_PASSWORD_LENGTH),
    });

    expect(result.success).toBe(true);
  });

  it("rejects a password one character too short, with the length in the message", () => {
    const result = loginSchema.safeParse({
      username: "emilys",
      password: "p".repeat(MIN_PASSWORD_LENGTH - 1),
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain(String(MIN_PASSWORD_LENGTH));
  });

  it("rejects a password over the maximum length", () => {
    const result = loginSchema.safeParse({
      username: "emilys",
      password: "p".repeat(MAX_INPUT_LENGTH + 1),
    });

    expect(result.success).toBe(false);
  });

  it("rejects missing fields and wrong types", () => {
    expect(loginSchema.safeParse({}).success).toBe(false);
    expect(loginSchema.safeParse({ username: 1, password: 2 }).success).toBe(false);
    expect(loginSchema.safeParse(null).success).toBe(false);
  });

  it("reports both problems at once", () => {
    const result = loginSchema.safeParse({ username: "", password: "x" });

    expect(result.error?.issues).toHaveLength(2);
  });
});
