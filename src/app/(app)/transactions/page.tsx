"use client";

import { useEffect, useState } from "react";

import { TransactionsTable, type Transaction } from "@/app/transactions-table";

type StatsForFilters = {
  months: { month: string }[];
  categories: { category: string }[];
};

// Hằng số module-scope: giữ tham chiếu ổn định giữa các lần render để không
// làm hỏng memoization của TransactionsTable khi chưa có dữ liệu lọc.
const EMPTY_MONTHS: { month: string }[] = [];
const EMPTY_CATEGORIES: { category: string }[] = [];
Object.freeze(EMPTY_MONTHS);
Object.freeze(EMPTY_CATEGORIES);

/** Trang "Giao dịch" (`/transactions`) — bảng giao dịch + bộ lọc tháng/danh mục. */
export default function TransactionsPage() {
  const [statsForFilters, setStatsForFilters] = useState<StatsForFilters | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthFilter, setMonthFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  // Tăng lên sau khi xoá một giao dịch để hai effect fetch dưới đây chạy lại
  // và lấy dữ liệu mới nhất — không gọi trực tiếp hàm setState trong effect.
  const [refreshKey, setRefreshKey] = useState(0);

  // `res.json<T>()` ở đây là generic của Cloudflare Workers (không phải DOM
  // chuẩn) — không truyền T thì suy luận ra `unknown`, phải chỉ rõ kiểu.
  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json<StatsForFilters>())
      .then(setStatsForFilters);
  }, [refreshKey]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (monthFilter) params.set("month", monthFilter);
    if (categoryFilter) params.set("category", categoryFilter);
    fetch(`/api/transactions?${params}`)
      .then((res) => res.json<Transaction[]>())
      .then(setTransactions);
  }, [monthFilter, categoryFilter, refreshKey]);

  async function handleDelete(id: number) {
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    setRefreshKey((k) => k + 1);
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-4 font-semibold">Danh sách giao dịch</h2>

      <TransactionsTable
        data={transactions}
        onDelete={handleDelete}
        months={statsForFilters?.months ?? EMPTY_MONTHS}
        categories={statsForFilters?.categories ?? EMPTY_CATEGORIES}
        monthFilter={monthFilter}
        onMonthFilterChange={setMonthFilter}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
      />
    </section>
  );
}
