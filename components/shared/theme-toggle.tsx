"use client";

import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTheme } from "next-themes";
import { useCallback } from "react";

import { Button } from "@/components/ui/button";

const ICON_SIZE = 18;
const DARK_THEME = "dark";
const LIGHT_THEME = "light";

/** Light/dark switch. next-themes saves the choice in localStorage, so it persists. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  const handleToggle = useCallback(() => {
    setTheme(resolvedTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME);
  }, [resolvedTheme, setTheme]);

  return (
    <Button
      id="btn-theme-toggle"
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={handleToggle}
      className="cursor-pointer"
    >
      {/*
        The server can't know the theme, so we render BOTH icons and let CSS show the right one
        (the `dark` class is on <html>). Choosing in JS would cause a hydration mismatch.
      */}
      <HugeiconsIcon icon={Sun03Icon} size={ICON_SIZE} className="hidden dark:block" />
      <HugeiconsIcon icon={Moon02Icon} size={ICON_SIZE} className="block dark:hidden" />
    </Button>
  );
}
