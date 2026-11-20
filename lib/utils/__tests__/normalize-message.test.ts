import { normalizeMessage } from "../normalize-message";

describe("normalizeMessage", () => {
  it("returns a string message unchanged", () => {
    expect(normalizeMessage("Invalid credentials")).toBe("Invalid credentials");
  });

  it("joins an array of messages with a comma", () => {
    expect(normalizeMessage(["Username is required", "Password is too short"])).toBe(
      "Username is required, Password is too short",
    );
  });

  it("returns an empty string for undefined, null, empty string and empty array", () => {
    expect(normalizeMessage(undefined)).toBe("");
    expect(normalizeMessage(null)).toBe("");
    expect(normalizeMessage("")).toBe("");
    expect(normalizeMessage([])).toBe("");
  });
});
