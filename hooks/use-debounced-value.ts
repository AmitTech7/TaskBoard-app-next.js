"use client";

import { useEffect, useState } from "react";

/** Returns `value`, but only after it has stopped changing for `delayMs` (e.g. while someone is typing). */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    // If `value` changes again before the delay is over, cancel the pending update.
    return () => {
      clearTimeout(timeoutId);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
