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
    // Xoay 180° khi trigger mở (dựa vào data-state của cha nhờ class `group`)
    // để báo trạng thái đóng/mở rõ hơn là chỉ đổi màu viền.
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4 shrink-0 opacity-50 transition-transform duration-150 group-data-[state=open]:rotate-180"
      aria-hidden
    >
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

// Mũi tên cuộn — cùng kiểu nét với ChevronIcon (chỉ đổi hướng/kích thước),
// thay cho ký tự "▴"/"▾" nhìn như lỗi hiển thị font.
function ScrollUpIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5" aria-hidden>
      <path d="m6 12 4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ScrollDownIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5" aria-hidden>
      <path d="m6 8 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
        // Mobile-first: h-11 (44px) đạt ngưỡng chạm tối thiểu; từ sm trở lên
        // thu lại h-10 cho gọn trên desktop (chuột, không cần vùng chạm lớn).
        // `group` để ChevronIcon bên trong đọc được data-state mà xoay.
        //
        // `RadixSelect.Value` bỏ qua className truyền vào (xem source: nó bị
        // destructure ra rồi không dùng lại) nên phải style span do nó render
        // gián tiếp qua selector con — đây là cách duy nhất để bắt tên danh
        // mục dài truncate bằng "…" thay vì đẩy chevron ra ngoài hoặc xuống dòng.
        className={`group inline-flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none transition select-none hover:border-zinc-300 focus-visible:ring-2 focus-visible:ring-zinc-900/20 data-[state=open]:border-zinc-300 sm:h-10 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600 dark:focus-visible:ring-zinc-100/20 [&>span:first-child]:min-w-0 [&>span:first-child]:flex-1 [&>span:first-child]:truncate [&>span:first-child]:text-left [&>span:last-child]:shrink-0 ${className}`}
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
          // Mobile: dùng gần hết chiều cao khả dụng (biến CSS do Radix tính, đã
          // trừ mép viewport) để danh sách tháng/danh mục dài đỡ phải cuộn
          // trong một popover bé tí trên điện thoại. Desktop giữ mức cũ (18rem)
          // cho gọn. max-w để tên danh mục dài không kéo panel tràn màn hình.
          className="z-50 max-h-[min(60vh,var(--radix-select-content-available-height,60vh))] max-w-[min(24rem,calc(100vw-2rem))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg sm:max-h-72 dark:border-zinc-700 dark:bg-zinc-800"
        >
          {/* Radix tự ẩn hai nút này khi danh sách không cuộn được, nên không
              cần tự kiểm tra overflow ở đây. */}
          <RadixSelect.ScrollUpButton className="flex h-6 items-center justify-center text-zinc-400">
            <ScrollUpIcon />
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
            <ScrollDownIcon />
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
      // h-11 (44px) trên mobile để bấm chính xác trong danh sách dài (tháng,
      // danh mục); sm trở lên thu về h-9 như cũ vì trỏ chuột không cần rộng.
      // Tương tự Value ở trên, `RadixSelect.ItemText` cũng bỏ qua className
      // của nó nên phải bắt span con qua `:first-child` để truncate tên dài.
      className="relative flex h-11 cursor-pointer items-center rounded-lg pr-8 pl-3 text-sm outline-none select-none data-[highlighted]:bg-zinc-100 sm:h-9 dark:data-[highlighted]:bg-zinc-700 [&>span:first-child]:min-w-0 [&>span:first-child]:flex-1 [&>span:first-child]:truncate"
    >
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
      <RadixSelect.ItemIndicator className="absolute right-2 inline-flex items-center">
        <CheckIcon />
      </RadixSelect.ItemIndicator>
    </RadixSelect.Item>
  );
}
