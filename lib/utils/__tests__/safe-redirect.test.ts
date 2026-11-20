import { getSafeRedirectPath } from "../safe-redirect";

const FALLBACK = "/tasks";

describe("getSafeRedirectPath", () => {
  it.each([
    ["/tasks", "/tasks"],
    ["/tasks?q=milk&page=2", "/tasks?q=milk&page=2"],
    ["/tasks/12?from=%2Ftasks", "/tasks/12?from=%2Ftasks"],
    ["/dashboard", "/dashboard"],
  ])("allows the in-site path %p", (input, expected) => {
    expect(getSafeRedirectPath(input, FALLBACK)).toBe(expected);
  });

  it.each([null, undefined, ""])("falls back when the value is %p", (input) => {
    expect(getSafeRedirectPath(input, FALLBACK)).toBe(FALLBACK);
  });

  describe("blocks open redirects", () => {
    it.each([
      ["protocol-relative URL", "//evil.com"],
      ["backslash trick", "/\\evil.com"],
      ["absolute https URL", "https://evil.com"],
      ["javascript: URL", "javascript:alert(1)"],
      ["relative path without a leading slash", "tasks"],
      ["tab smuggled in ('/<tab>/evil.com' becomes '//evil.com')", "/\t/evil.com"],
      ["newline smuggled in", "/\n/evil.com"],
      ["null byte", "/\u0000evil"],
    ])("rejects a %s", (_label, input) => {
      expect(getSafeRedirectPath(input, FALLBACK)).toBe(FALLBACK);
    });
  });

  describe("double-encoded values", () => {
    it("decodes a value that still starts with an encoded slash", () => {
      expect(getSafeRedirectPath("%2Ftasks%3Fq%3Dmilk", FALLBACK)).toBe("/tasks?q=milk");
    });

    it("still blocks an encoded protocol-relative URL", () => {
      expect(getSafeRedirectPath("%2F%2Fevil.com", FALLBACK)).toBe(FALLBACK);
    });

    it("still blocks an encoded backslash trick", () => {
      expect(getSafeRedirectPath("%2F%5Cevil.com", FALLBACK)).toBe(FALLBACK);
    });

    it("falls back (no crash) on a malformed escape after an encoded slash", () => {
      expect(getSafeRedirectPath("%2F%E0%A4%A", FALLBACK)).toBe(FALLBACK);
    });

    it("does NOT decode a normal value a second time (keeps '100%25' intact)", () => {
      expect(getSafeRedirectPath("/tasks?q=100%25", FALLBACK)).toBe("/tasks?q=100%25");
    });
  });
});
