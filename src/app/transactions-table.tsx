"use client";

import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { useState } from "react";

import { CategoryPicker } from "./category-picker";
import { formatDate, formatDateTime, formatMonth } from "./format";
import { PAGE_SIZE } from "./pagination";
import { Select } from "./select";
import { TransactionDetailModal } from "./transaction-detail-modal";

export type Transaction = {
  id: number;
  date: string;
  description: string;
  amount: number;
  category: string;
  created_at?: string;
  source_file?: string | null;
};

/** Callback của trang, đi qua `options.meta` để columns dựng được ở module scope. */
type TableMeta = {
  onDelete: (id: number) => void;
  onCategoryChange: (id: number, category: string) => void;
  /** Id đang chờ PATCH — khóa chip lại để không bắn hai lần đổi chồng nhau. */
  pendingCategoryIds: ReadonlySet<number>;
};

/**
 * Chỉ đăng ký feature thực sự dùng — v9 không bật sẵn gì cả, thiếu feature thì
 * state và API tương ứng cũng không tồn tại. `filteredRowModel` bắt buộc đi kèm
 * `columnFilteringFeature`, kể cả khi chỉ dùng global filter.
 */
const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  tableMeta: {} as TableMeta,
});

const helper = createColumnHelper<typeof features, Transaction>();

/** Cột canh phải: số tiền và nút xóa. */
const RIGHT_ALIGNED = new Set(["amount", "actions"]);

function formatVnd(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);
}

// Columns phải ổn định giữa các lần render, nên chúng nằm ở module scope và lấy
// `onDelete` từ `table.options.meta` thay vì closure.
const columns = helper.columns([
  // accessor giữ nguyên "YYYY-MM-DD" thô để sort đúng thứ tự chuỗi (định dạng
  // DD/MM/YYYY sort sai, ví dụ "10/02" sẽ đứng trước "09/03"); định dạng hiển
  // thị chỉ nằm ở cell, giống cách cột amount tách số thô khỏi phần hiển thị.
  helper.accessor("date", {
    header: "Ngày",
    cell: (info) => {
      const t = info.row.original;
      return (
        <span title={t.created_at ? `Nhập lúc ${formatDateTime(t.created_at)}` : undefined}>
          {formatDate(info.getValue())}
        </span>
      );
    },
  }),
  helper.accessor("description", { header: "Mô tả" }),
  helper.accessor("category", {
    header: "Danh mục",
    // Chip là nút mở dropdown: phân loại tự động chỉ dò từ khóa nên sai là
    // chuyện thường, sửa ngay tại chỗ nhìn thấy sai đỡ hơn bắt vào trang khác.
    cell: (info) => (
      <CategoryPicker
        value={info.getValue()}
        onChange={(category) =>
          info.table.options.meta?.onCategoryChange(info.row.original.id, category)
        }
        disabled={info.table.options.meta?.pendingCategoryIds.has(info.row.original.id)}
      />
    ),
  }),
  // accessor giữ số thô để sort đúng thứ tự; định dạng nằm ở cell.
  helper.accessor("amount", {
    header: "Số tiền",
    cell: (info) => {
      const amount = info.getValue();
      return (
        <span
          className={
            amount < 0 ? "text-red-600 dark:text-red-400" : "text-green-700 dark:text-green-400"
          }
        >
          {formatVnd(amount)}
        </span>
      );
    },
  }),
  helper.display({
    id: "actions",
    header: "",
    enableGlobalFilter: false,
    cell: (info) => (
      <button
        onClick={() => info.table.options.meta?.onDelete(info.row.original.id)}
        className="text-xs text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
      >
        Xóa
      </button>
    ),
  }),
]);

function csvEscape(value: string): string {
  // Số tiền âm ("-50000") hay mô tả copy từ PDF bắt đầu bằng =/+/-/@ đều bị
  // Excel/Sheets hiểu thành công thức khi mở file — thêm nháy đơn phía trước
  // để ép về dạng text (CSV formula injection, xem OWASP CSV Injection).
  let v = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  // Bọc dấu ngoặc kép nếu có phẩy/ngoặc kép/xuống dòng — mô tả giao dịch có
  // thể chứa cả ba (copy nguyên từ PDF sao kê).
  if (/[",\n\r]/.test(v)) v = `"${v.replace(/"/g, '""')}"`;
  return v;
}

/** Xuất đúng tập giao dịch truyền vào (đã lọc/sắp xếp ở nơi gọi) ra file CSV, tải về ngay trên trình duyệt. */
function exportTransactionsCsv(rows: Transaction[]) {
  const header = ["Ngày", "Mô tả", "Danh mục", "Số tiền"];
  // ﻿ (BOM): Excel trên Windows không tự nhận UTF-8 nếu thiếu, chữ có
  // dấu tiếng Việt sẽ hiện sai ký tự khi mở file.
  const lines = [header.join(",")].concat(
    rows.map((t) =>
      [t.date, csvEscape(t.description), csvEscape(t.category), csvEscape(String(t.amount))].join(","),
    ),
  );
  const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `giao-dich-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  // Cùng mức tương phản AA với nhãn cột: hình mũi tên đã phân biệt trạng thái
  // ("↕" chưa sắp xếp vs "↑"/"↓"), nên không cần làm nhạt đi để báo hiệu — làm
  // nhạt chỉ khiến chỉ báo tụt xuống 2.56:1 và biến thành tín hiệu chỉ-bằng-màu.
  if (!direction) return <span className="text-zinc-500 dark:text-zinc-400">↕</span>;
  return <span>{direction === "asc" ? "↑" : "↓"}</span>;
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
      <path
        d="M5 6h10M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6m2 0-.6 9.4a1.5 1.5 0 0 1-1.5 1.6H8.1a1.5 1.5 0 0 1-1.5-1.6L6 6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Cột có thể sort, dùng cho dãy nút sắp xếp ở mobile — layout dạng card không có
 * header cột để bấm như bảng desktop. Không dùng `Select` ở đây vì `Select` luôn
 * chèn thêm một item "tất cả" (xem `select.tsx`), không hợp với sắp xếp.
 */
const SORTABLE_COLUMNS: { id: string; label: string }[] = [
  { id: "date", label: "Ngày" },
  { id: "description", label: "Mô tả" },
  { id: "category", label: "Danh mục" },
  { id: "amount", label: "Số tiền" },
];

export function TransactionsTable({
  data,
  onDelete,
  onCategoryChange,
  pendingCategoryIds,
  months,
  categories,
  monthFilter,
  onMonthFilterChange,
  categoryFilter,
  onCategoryFilterChange,
}: {
  data: Transaction[];
  onDelete: (id: number) => void;
  onCategoryChange: (id: number, category: string) => void;
  pendingCategoryIds: ReadonlySet<number>;
  months: { month: string }[];
  categories: { category: string }[];
  monthFilter: string;
  onMonthFilterChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
}) {
  // Giao dịch đang mở modal chi tiết — lưu cả object thay vì chỉ id để đóng
  // xong vẫn còn dữ liệu render trong lúc modal fade-out (không dùng ở đây vì
  // đóng là gỡ luôn, nhưng tránh phải tra cứu lại `data` mỗi lần render).
  const [selected, setSelected] = useState<Transaction | null>(null);

  const table = useTable({
    features,
    columns,
    data,
    meta: { onDelete, onCategoryChange, pendingCategoryIds },
    initialState: {
      sorting: [{ id: "date", desc: true }],
      pagination: { pageIndex: 0, pageSize: PAGE_SIZE },
    },
  });

  const rows = table.getRowModel().rows;
  const filteredCount = table.getRowCount();
  const { pageIndex, pageSize } = table.state.pagination;
  const firstRow = filteredCount === 0 ? 0 : pageIndex * pageSize + 1;
  const lastRow = Math.min((pageIndex + 1) * pageSize, filteredCount);

  // Xuất theo đúng tập đang lọc/sắp xếp (search + hai Select), KHÔNG chỉ trang
  // hiện tại — `getRowModel()` đã cắt theo trang, phải lùi về sortedRowModel
  // (bước ngay trước pagination) để lấy toàn bộ.
  function handleExportCsv() {
    exportTransactionsCsv(table.getSortedRowModel().rows.map((row) => row.original));
  }

  // Nhãn hiển thị "02/2026" nhưng value gửi lên API vẫn giữ "YYYY-MM" thô —
  // đổi value theo định dạng hiển thị sẽ làm hỏng filter (?month=).
  const monthOptions = months.map((m) => ({ value: m.month, label: formatMonth(m.month) }));
  const categoryOptions = categories.map((c) => ({ value: c.category, label: c.category }));

  return (
    <>
      {/* Toolbar: search chiếm cả dòng trên mobile, hai Select nằm cạnh nhau ở dòng dưới;
          từ sm trở lên gộp lại thành một dòng ngang. */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <input
          type="search"
          value={table.state.globalFilter ?? ""}
          onChange={(e) => table.setGlobalFilter(e.target.value)}
          placeholder="Tìm mô tả, danh mục, số tiền..."
          className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-800 sm:w-72"
        />
        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
          <Select
            value={monthFilter}
            onValueChange={onMonthFilterChange}
            options={monthOptions}
            placeholder="Tất cả tháng"
            ariaLabel="Lọc theo tháng"
            className="sm:w-36"
          />
          <Select
            value={categoryFilter}
            onValueChange={onCategoryFilterChange}
            options={categoryOptions}
            placeholder="Tất cả danh mục"
            ariaLabel="Lọc theo danh mục"
            className="sm:w-44"
          />
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={filteredCount === 0}
          className="h-10 shrink-0 rounded-lg border border-zinc-200 px-3 text-sm font-medium transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Xuất CSV
        </button>
      </div>

      {/* Điều khiển sắp xếp riêng cho mobile: layout dạng card không có header cột để bấm. */}
      <div className="mb-3 grid grid-cols-4 gap-2 sm:hidden">
        {SORTABLE_COLUMNS.map(({ id, label }) => {
          const column = table.getColumn(id);
          if (!column) return null;
          const sorted = column.getIsSorted();
          return (
            <button
              key={id}
              type="button"
              onClick={column.getToggleSortingHandler()}
              aria-label={`Sắp xếp theo ${label}`}
              className={`flex h-10 items-center justify-center gap-1 rounded-lg border px-1 text-xs font-medium transition ${
                sorted
                  ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                  : "border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600"
              }`}
            >
              {label}
              <SortIcon direction={sorted} />
            </button>
          );
        })}
      </div>

      {/* `min-h-0 flex-1 overflow-y-auto`: đây là phần duy nhất cuộn trong bảng —
          toolbar, nút sắp xếp mobile và phân trang bên dưới đứng yên, không bị
          đẩy ra ngoài màn hình khi danh sách dài. Bọc chung cả bản mobile lẫn
          desktop vì mỗi lúc chỉ một bản hiển thị (`sm:hidden`/`hidden sm:block`). */}
      <div className="min-h-0 flex-1 overflow-y-auto">
      {/* Mobile (base): danh sách dạng card, cùng row model như bảng desktop. */}
      <div className="flex flex-col gap-2 sm:hidden">
        {rows.map((row) => {
          const t = row.original;
          return (
            <div
              key={row.id}
              onClick={() => setSelected(t)}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {t.description}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="whitespace-nowrap">{formatDate(t.date)}</span>
                  {/* h-9 (36px): chưa đủ 44px như các nút khác trong repo, và đó
                      là đánh đổi có chủ ý — chip nằm giữa một dòng chữ nhỏ trong
                      thẻ, cao 44px sẽ đội cả thẻ lên. Vẫn hơn hẳn ~20px của chip
                      đặc; nút xóa 44px bên phải vẫn là vùng chạm chính của thẻ.
                      stopPropagation: chip mở dropdown riêng, không phải mở modal. */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <CategoryPicker
                      value={t.category}
                      onChange={(category) => table.options.meta?.onCategoryChange(t.id, category)}
                      disabled={table.options.meta?.pendingCategoryIds.has(t.id)}
                      className="h-9 px-2.5"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span
                  className={`text-sm font-semibold whitespace-nowrap ${
                    t.amount < 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-green-700 dark:text-green-400"
                  }`}
                >
                  {formatVnd(t.amount)}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    table.options.meta?.onDelete(t.id);
                  }}
                  aria-label="Xóa giao dịch"
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
                >
                  <DeleteIcon />
                </button>
              </div>
            </div>
          );
        })}
        {rows.length === 0 && (
          <div className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            {data.length === 0
              ? "Chưa có giao dịch nào. Hãy tải lên file sao kê PDF ở trên."
              : "Không có giao dịch nào khớp từ khóa tìm kiếm."}
          </div>
        )}
      </div>

      {/* Desktop (sm+): bảng thật với header có thể sort, cùng row model như trên. */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr
                key={group.id}
                className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-800 dark:text-zinc-400"
              >
                {group.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`py-2 pr-3 font-medium ${RIGHT_ALIGNED.has(header.column.id) ? "text-right" : ""}`}
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="inline-flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100"
                      >
                        <table.FlexRender header={header} />
                        <SortIcon direction={header.column.getIsSorted()} />
                      </button>
                    ) : (
                      <table.FlexRender header={header} />
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => setSelected(row.original)}
                className="cursor-pointer border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800/50 dark:hover:bg-zinc-800/40"
              >
                {row.getAllCells().map((cell) => (
                  <td
                    key={cell.id}
                    // Cột danh mục/xóa có control bấm riêng (dropdown, nút xóa) —
                    // chặn bubble để click vào đó không mở luôn modal chi tiết.
                    onClick={
                      cell.column.id === "category" || cell.column.id === "actions"
                        ? (e) => e.stopPropagation()
                        : undefined
                    }
                    className={`py-2 pr-3 ${
                      RIGHT_ALIGNED.has(cell.column.id) ? "text-right whitespace-nowrap" : ""
                    } ${cell.column.id === "date" ? "whitespace-nowrap" : ""}`}
                  >
                    <table.FlexRender cell={cell} />
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={table.getAllColumns().length} className="py-8 text-center text-zinc-500 dark:text-zinc-400">
                  {data.length === 0
                    ? "Chưa có giao dịch nào. Hãy tải lên file sao kê PDF ở trên."
                    : "Không có giao dịch nào khớp từ khóa tìm kiếm."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>

      {filteredCount > pageSize && (
        <div className="mt-4 flex flex-col gap-2 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between dark:text-zinc-400">
          <span className="text-center sm:text-left">
            {firstRow}–{lastRow} của {filteredCount}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-10 flex-1 rounded-lg border border-zinc-200 px-3 transition hover:bg-zinc-100 disabled:opacity-40 disabled:hover:bg-transparent dark:border-zinc-700 dark:hover:bg-zinc-800 sm:h-auto sm:flex-none sm:py-1"
            >
              Trước
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-10 flex-1 rounded-lg border border-zinc-200 px-3 transition hover:bg-zinc-100 disabled:opacity-40 disabled:hover:bg-transparent dark:border-zinc-700 dark:hover:bg-zinc-800 sm:h-auto sm:flex-none sm:py-1"
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {selected && (
        <TransactionDetailModal
          transaction={selected}
          onClose={() => setSelected(null)}
          onCategoryChange={(id, category) => {
            table.options.meta?.onCategoryChange(id, category);
            // Cập nhật lạc quan luôn phần đang hiển thị trong modal — không thì
            // chip trong modal đứng yên ở giá trị cũ cho tới khi `data` re-fetch
            // xong và đẩy prop `selected` mới xuống (chưa xảy ra vì modal giữ
            // state riêng, không tự ăn theo `rows` đổi).
            setSelected((prev) => (prev && prev.id === id ? { ...prev, category } : prev));
          }}
          onDelete={(id) => table.options.meta?.onDelete(id)}
          pendingCategory={table.options.meta?.pendingCategoryIds.has(selected.id) ?? false}
        />
      )}
    </>
  );
}
