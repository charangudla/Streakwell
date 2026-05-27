"use client";

import { useEffect, useId, useRef, useState } from "react";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  id?: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  /** Tailwind classes appended to the trigger button. */
  className?: string;
  "aria-label"?: string;
}

/**
 * Custom select that replaces the native <select>. We can't style the
 * native open dropdown (the browser renders it at the OS font size, ~13px
 * on macOS) so the option list looked tiny next to our 16px trigger.
 * This component gives us full control: same Tailwind tokens as the rest
 * of the app, large readable options, hover + selected affordance, and
 * proper keyboard nav.
 *
 * Accessibility: combobox-listbox pattern. Trigger is a button with
 * aria-haspopup="listbox" / aria-expanded. List items are role="option"
 * with aria-selected. Enter / Space opens or commits, ArrowUp/Down moves
 * the highlight, Escape closes. Click outside closes. The selected
 * option is scrolled into view when the menu opens so a long list
 * doesn't hide the current pick.
 *
 * Generic over T so the value type stays narrow ("ALL" | "BEGINNER" |
 * "EASY" | ... rather than just string) in the caller.
 */
export function Select<T extends string>({
  id,
  value,
  options,
  onChange,
  disabled,
  className = "",
  "aria-label": ariaLabel,
}: Props<T>) {
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const listId = `${triggerId}-listbox`;

  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState<number>(() => {
    const i = options.findIndex((o) => o.value === value);
    return i >= 0 ? i : 0;
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Keep the highlighted index in sync when `value` changes externally
  // — without this an upstream "Clear filters" click would leave the
  // highlight pointing at the previously-selected row.
  useEffect(() => {
    const i = options.findIndex((o) => o.value === value);
    if (i >= 0) setHighlighted(i);
  }, [value, options]);

  // Close on click outside. We listen on `mousedown` (not click) so the
  // menu closes BEFORE a click handler elsewhere fires — otherwise a
  // click on another control would have to fight the open menu's
  // event order.
  useEffect(() => {
    if (!open) return;
    function onDocDown(e: MouseEvent | TouchEvent) {
      const target = e.target as Node | null;
      if (!target) return;
      if (
        triggerRef.current?.contains(target) ||
        listRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("touchstart", onDocDown);
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("touchstart", onDocDown);
    };
  }, [open]);

  // Scroll the highlighted row into view when the menu opens / arrow
  // keys move past the visible area. Without this, a long list (e.g.,
  // 20 categories) would hide the current pick.
  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    if (!list) return;
    const el = list.children[highlighted] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [open, highlighted]);

  function commit(i: number) {
    const opt = options[i];
    if (!opt) return;
    onChange(opt.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;

    if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
      }
      return;
    }

    if (!open) {
      if (
        e.key === "Enter" ||
        e.key === " " ||
        e.key === "ArrowDown" ||
        e.key === "ArrowUp"
      ) {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    // Open + a key
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      commit(highlighted);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(options.length - 1, h + 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(0, h - 1));
      return;
    }
    if (e.key === "Home") {
      e.preventDefault();
      setHighlighted(0);
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      setHighlighted(options.length - 1);
      return;
    }
  }

  const selected =
    options.find((o) => o.value === value) ?? options[0] ?? {
      value: "" as T,
      label: "",
    };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className={`flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 text-left text-base text-ink transition-colors hover:border-slate-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-ink-muted ${className}`}
      >
        <span className="truncate">{selected.label}</span>
        <ChevronIcon open={open} />
      </button>

      {open ? (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-activedescendant={`${triggerId}-opt-${highlighted}`}
          className="absolute left-0 right-0 z-50 mt-1 max-h-72 overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black/5"
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === value;
            const isHighlighted = i === highlighted;
            return (
              <li
                key={opt.value}
                id={`${triggerId}-opt-${i}`}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setHighlighted(i)}
                // Use onMouseDown (not onClick) so the menu commits BEFORE
                // the trigger button's blur handler can fire — otherwise
                // we'd close on blur first and lose the click.
                onMouseDown={(e) => {
                  e.preventDefault();
                  commit(i);
                }}
                className={`flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-base transition-colors ${
                  isHighlighted ? "bg-brand-50" : ""
                } ${
                  isSelected
                    ? "font-semibold text-brand-700"
                    : "text-ink"
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected ? <CheckIcon /> : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 flex-none text-ink-muted transition-transform ${
        open ? "rotate-180" : ""
      }`}
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 flex-none"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
