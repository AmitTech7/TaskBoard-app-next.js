"use client";

import { Tick02Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const ICON_SIZE = 16;

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxItemProps {
  option: ComboboxOption;
  isSelected: boolean;
  onPick: (value: string) => void;
}

// Own component (not defined inside Combobox) so each row can have its own stable handler.
function ComboboxItem({ option, isSelected, onPick }: Readonly<ComboboxItemProps>) {
  const handleSelect = useCallback(() => {
    onPick(option.value);
  }, [onPick, option.value]);

  return (
    // `value` is what cmdk searches against, so we give it the visible label.
    <CommandItem value={option.label} onSelect={handleSelect} className="cursor-pointer">
      <span className="wrap-break-word">{option.label}</span>
      <HugeiconsIcon
        icon={Tick02Icon}
        size={ICON_SIZE}
        className={cn("ml-auto", isSelected ? "opacity-100" : "opacity-0")}
      />
    </CommandItem>
  );
}

interface ComboboxProps {
  id?: string;
  options: ComboboxOption[];
  /** Selected value. An empty string means "nothing selected" (never null). */
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
}

/** Searchable dropdown. We use this instead of shadcn `Select` everywhere. */
export function Combobox({
  id,
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  disabled = false,
  className,
}: Readonly<ComboboxProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  const handlePick = useCallback(
    (picked: string) => {
      // Picking the already-selected option clears it back to "".
      onValueChange(picked === value ? "" : picked);
      setIsOpen(false);
    },
    [onValueChange, value],
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          disabled={disabled}
          className={cn("w-full cursor-pointer justify-between font-normal", className)}
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected?.label ?? placeholder}
          </span>
          <HugeiconsIcon icon={ArrowDown01Icon} size={ICON_SIZE} className="shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <ComboboxItem
                  key={option.value}
                  option={option}
                  isSelected={option.value === value}
                  onPick={handlePick}
                />
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
