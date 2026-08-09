"use client";

import * as RadixSelect from "@radix-ui/react-select";

export type SelectOption = { value: string; label: string };

/**
 * Dropdown dùng chung, bọc Radix Select. Radix lo phần a11y / bàn phím / portal;
 * ở đây chỉ còn style.
 *
 * Radix không cho item mang `value=""`, nên tùy chọn "tất cả" dùng một sentinel
 * và được quy đổi lại thành chuỗi rỗng ở `onValueChange` — bên ngoài vẫn làm
 * việc với `""` như một `<select>` thường.
 */
const ALL = "__all__";

function ChevronIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0 opacity-50" aria-hidden>
      <path d="m6 8 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
      <path d="m5 10 3.5 3.5L15 7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder,
  ariaLabel,
  className = "",
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder: string;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <RadixSelect.Root
      value={value === "" ? ALL : value}
      onValueChange={(next) => onValueChange(next === ALL ? "" : next)}
    >
      <RadixSelect.Trigger
        aria-label={ariaLabel}
        className={`inline-flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none transition select-none hover:border-zinc-300 focus-visible:ring-2 focus-visible:ring-zinc-900/20 data-[state=open]:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600 dark:focus-visible:ring-zinc-100/20 ${className}`}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon>
          <ChevronIcon />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={6}
          className="z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
        >
          <RadixSelect.ScrollUpButton className="flex h-6 items-center justify-center text-zinc-400">
            ▴
          </RadixSelect.ScrollUpButton>
          <RadixSelect.Viewport className="p-1">
            <Item value={ALL}>{placeholder}</Item>
            {options.map((option) => (
              <Item key={option.value} value={option.value}>
                {option.label}
              </Item>
            ))}
          </RadixSelect.Viewport>
          <RadixSelect.ScrollDownButton className="flex h-6 items-center justify-center text-zinc-400">
            ▾
          </RadixSelect.ScrollDownButton>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}

function Item({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <RadixSelect.Item
      value={value}
      className="relative flex h-9 cursor-pointer items-center rounded-lg pr-8 pl-3 text-sm outline-none select-none data-[highlighted]:bg-zinc-100 dark:data-[highlighted]:bg-zinc-700"
    >
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
      <RadixSelect.ItemIndicator className="absolute right-2 inline-flex items-center">
        <CheckIcon />
      </RadixSelect.ItemIndicator>
    </RadixSelect.Item>
  );
}
