"use client";

import { useEffect } from "react";

import { CategoryPicker } from "./category-picker";
import { formatDate, formatDateTime } from "./format";
import type { Transaction } from "./transactions-table";

function formatVnd(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);
}

/**
 * Modal xem chi tiết một giao dịch — bấm vào dòng/thẻ trong bảng mở ra, vì
 * bảng chỉ hiển thị mô tả đã cắt bớt (`truncate` trên mobile, cột hẹp trên
 * desktop) nên không phải lúc nào cũng đọc được hết. Tự dựng bằng div + cờ
 * đóng/mở, không thêm dependency dialog vì đây là modal duy nhất trong app.
 */
export function TransactionDetailModal({
  transaction,
  onClose,
  onCategoryChange,
  onDelete,
  pendingCategory,
}: {
  transaction: Transaction;
  onClose: () => void;
  onCategoryChange: (id: number, category: string) => void;
  onDelete: (id: number) => void;
  pendingCategory: boolean;
}) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Chi tiết giao dịch"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-2xl border border-zinc-200 bg-white p-5 shadow-xl sm:rounded-2xl dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold">Chi tiết giao dịch</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            ✕
          </button>
        </div>

        <p className="mb-1 text-sm break-words whitespace-pre-wrap text-zinc-900 dark:text-zinc-100">
          {transaction.description}
        </p>
        <p
          className={`mb-4 text-2xl font-bold ${
            transaction.amount < 0 ? "text-red-600 dark:text-red-400" : "text-green-700 dark:text-green-400"
          }`}
        >
          {formatVnd(transaction.amount)}
        </p>

        <dl className="space-y-2.5 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-zinc-500 dark:text-zinc-400">Ngày</dt>
            <dd className="text-right" title={transaction.created_at ? `Nhập lúc ${formatDateTime(transaction.created_at)}` : undefined}>
              {formatDate(transaction.date)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-zinc-500 dark:text-zinc-400">Danh mục</dt>
            <dd>
              <CategoryPicker
                value={transaction.category}
                onChange={(category) => onCategoryChange(transaction.id, category)}
                disabled={pendingCategory}
              />
            </dd>
          </div>
          {transaction.source_file && (
            <div className="flex items-center justify-between gap-3">
              <dt className="shrink-0 text-zinc-500 dark:text-zinc-400">Nguồn</dt>
              <dd className="truncate text-right" title={transaction.source_file}>
                {transaction.source_file}
              </dd>
            </div>
          )}
        </dl>

        <button
          type="button"
          onClick={() => {
            onDelete(transaction.id);
            onClose();
          }}
          className="mt-5 flex h-11 w-full items-center justify-center rounded-lg border border-red-200 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
        >
          Xóa giao dịch
        </button>
      </div>
    </div>
  );
}
