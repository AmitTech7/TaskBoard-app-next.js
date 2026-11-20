"use client";

import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useState, type ChangeEvent } from "react";

import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

import { SEARCH_DEBOUNCE_MS } from "../constants";

interface TasksSearchInputProps {
  /** The search text currently in the URL (the source of truth). */
  value: string;
  onSearch: (value: string) => void;
}

const ICON_SIZE = 16;

/**
 * Typing updates a local `draft` instantly (so typing feels snappy), and the URL is updated only
 * once typing pauses (so we don't write a history entry per keystroke).
 */
export function TasksSearchInput({ value, onSearch }: Readonly<TasksSearchInputProps>) {
  const [draft, setDraft] = useState(value);
  const [syncedValue, setSyncedValue] = useState(value);

  // The URL changed from outside (Back button, a link): show it in the box.
  // This is React's recommended "adjust state while rendering" pattern, instead of an effect.
  if (value !== syncedValue) {
    setSyncedValue(value);
    setDraft(value);
  }

  const debouncedDraft = useDebouncedValue(draft, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    // Only act once typing has settled (debounced === draft). Otherwise a stale debounced value
    // could overwrite a URL that just changed from outside.
    if (debouncedDraft === draft && debouncedDraft !== value) {
      onSearch(debouncedDraft);
    }
  }, [debouncedDraft, draft, value, onSearch]);

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setDraft(event.target.value);
  }, []);

  return (
    <div className="relative w-full sm:max-w-xs">
      <HugeiconsIcon
        icon={Search01Icon}
        size={ICON_SIZE}
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        id="input-tasks-search"
        type="search"
        value={draft}
        onChange={handleChange}
        placeholder="Search tasks..."
        aria-label="Search tasks"
        className="pl-9"
      />
    </div>
  );
}
