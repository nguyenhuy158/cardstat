"use client";

import * as RadixSelect from "@radix-ui/react-select";

import { CATEGORIES, OTHER_CATEGORY } from "@/domain/services/categorize";
import { categoryChipStyle } from "./colors";

/**
 * `CATEGORIES` xếp theo thứ tự ưu tiên khớp từ khóa của `RULES` ("Trả góp",
 * "Thanh toán thẻ" đứng đầu) — hợp lý cho máy dò, khó tra cho người. Ở dropdown
 * xếp lại theo alphabet tiếng Việt và ghim "Khác" xuống cuối; không đụng vào
 * `RULES` (đổi là đổi luôn kết quả phân loại) cũng không đụng `CATEGORY_COLORS`
 * (thứ tự ở đó đã qua kiểm định CVD theo cặp liền kề).
 */
const PICKER_CATEGORIES = [...CATEGORIES]
  .filter((c) => c !== OTHER_CATEGORY)
  // `.sort` chứ không `.toSorted`: repo không đặt browserslist nên target mặc
  // định của Next lùi tới Safari 12, ở đó `toSorted` không tồn tại — file này là
  // client component nên lỗi sẽ nổ lúc load module và chết cả trang /transactions.
  .sort((a, b) => a.localeCompare(b, "vi"))
  .concat(OTHER_CATEGORY);

/**
 * Chip danh mục bấm được để sửa phân loại. Không dùng `Select` chung vì component
 * đó luôn chèn thêm một mục "tất cả" (dành cho bộ lọc) — ở đây mọi giao dịch đều
 * phải có đúng một danh mục, không có trạng thái rỗng.
 *
 * Danh sách lấy từ `CATEGORIES` (tập autoCategorize sinh ra) chứ không phải từ
 * các danh mục đang có trong DB: mới nhập một sao kê toàn "Ăn uống" thì vẫn phải
 * đổi được sang danh mục chưa từng xuất hiện.
 */
export function CategoryPicker({
  value,
  onChange,
  disabled = false,
  className = "",
}: {
  value: string;
  onChange: (category: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <RadixSelect.Root
      value={value}
      onValueChange={(next) => {
        // Radix bắn cả khi chọn lại đúng giá trị cũ — chặn ở đây để không gửi
        // PATCH thừa và không nháy lại cả bảng vì một thao tác không đổi gì.
        if (next !== value) onChange(next);
      }}
      disabled={disabled}
    >
      <RadixSelect.Trigger
        aria-label={`Danh mục: ${value}. Bấm để đổi`}
        style={categoryChipStyle(value)}
        // `RadixSelect.Value` nuốt className nên phải truncate qua selector con:
        // nhãn dài nhất ("Rút tiền / Phí") trong thẻ mobile hẹp sẽ đẩy mũi tên
        // ra ngoài hoặc xuống dòng thay vì cắt bớt.
        className={`inline-flex max-w-full min-w-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs outline-none transition select-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-zinc-900/40 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-zinc-100/40 [&>span:first-child]:min-w-0 [&>span:first-child]:truncate ${className}`}
      >
        <RadixSelect.Value />
        <RadixSelect.Icon>
          <ChevronIcon />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={6}
          className="z-50 max-h-[min(60vh,var(--radix-select-content-available-height,60vh))] max-w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg sm:max-h-72 dark:border-zinc-700 dark:bg-zinc-800"
        >
          <RadixSelect.ScrollUpButton className="flex h-6 items-center justify-center text-zinc-500 dark:text-zinc-400">
            <ScrollIcon up />
          </RadixSelect.ScrollUpButton>
          <RadixSelect.Viewport className="p-1">
            {PICKER_CATEGORIES.map((category) => (
              <RadixSelect.Item
                key={category}
                value={category}
                // h-11 (44px) trên mobile cho vùng chạm, h-9 từ sm — giống
                // `Select` chung để hai dropdown không lệch nhau về cảm giác.
                className="relative flex h-11 cursor-pointer items-center gap-2 rounded-lg pr-8 pl-3 text-sm outline-none select-none data-[highlighted]:bg-zinc-100 sm:h-9 dark:data-[highlighted]:bg-zinc-700"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: categoryChipStyle(category).backgroundColor }}
                  aria-hidden
                />
                <RadixSelect.ItemText>{category}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator className="absolute right-2 inline-flex items-center">
                  <CheckIcon />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
          <RadixSelect.ScrollDownButton className="flex h-6 items-center justify-center text-zinc-500 dark:text-zinc-400">
            <ScrollIcon />
          </RadixSelect.ScrollDownButton>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-3 w-3 shrink-0" aria-hidden>
      <path d="m6 8 4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ScrollIcon({ up = false }: { up?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5" aria-hidden>
      <path
        d={up ? "m6 12 4-4 4 4" : "m6 8 4 4 4-4"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
