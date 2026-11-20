import { act, renderHook } from "@testing-library/react";

import { useDebouncedValue } from "../use-debounced-value";

describe("useDebouncedValue", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("starts with the initial value", () => {
    const { result } = renderHook(() => useDebouncedValue("a", 300));

    expect(result.current).toBe("a");
  });

  it("only updates after the delay has passed", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: "a" },
    });

    rerender({ value: "b" });
    expect(result.current).toBe("a");

    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(result.current).toBe("a");

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe("b");
  });

  it("restarts the timer while the value keeps changing (typing)", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: "" },
    });

    rerender({ value: "m" });
    act(() => {
      jest.advanceTimersByTime(200);
    });
    rerender({ value: "mi" });
    act(() => {
      jest.advanceTimersByTime(200);
    });
    rerender({ value: "mil" });

    // 400ms passed in total, but each keystroke restarted the 300ms timer.
    expect(result.current).toBe("");

    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe("mil");
  });

  it("works with non-string values", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 100), {
      initialProps: { value: 1 },
    });

    rerender({ value: 2 });
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current).toBe(2);
  });

  it("does not update after unmount (no leaked timer)", () => {
    const { unmount, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: "a" },
    });

    rerender({ value: "b" });
    unmount();

    expect(jest.getTimerCount()).toBe(0);
  });
});
