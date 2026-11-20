import { formatDateDisplay } from "../date";

describe("formatDateDisplay", () => {
  it("formats a Date as MM/DD/YYYY", () => {
    expect(formatDateDisplay(new Date(2026, 10, 20))).toBe("11/20/2026");
  });

  it("pads single-digit months and days with a zero", () => {
    expect(formatDateDisplay(new Date(2026, 0, 5))).toBe("01/05/2026");
  });

  it("accepts a timestamp number", () => {
    expect(formatDateDisplay(new Date(2024, 1, 29).getTime())).toBe("02/29/2024");
  });

  it("accepts a date string", () => {
    expect(formatDateDisplay("2026-03-09T12:00:00")).toBe("03/09/2026");
  });

  it.each([null, undefined, "", "not a date"])("returns an empty string for %p", (input) => {
    expect(formatDateDisplay(input)).toBe("");
  });
});
