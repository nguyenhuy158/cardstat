"use client";

import { useEffect, useState } from "react";

import { CategoryChart, MonthChart } from "@/app/charts";
import { FetchError } from "@/app/fetch-error";
import { ChartsSkeleton } from "@/app/skeleton";

type Stats = {
  byCategory: { category: string; total: number }[];
  byMonth: { month: string; spend: number; income: number }[];
};

/** Trang "Biểu đồ" (`/charts`) — chỉ hai biểu đồ, tự fetch `/api/stats` riêng. */
export default function ChartsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  // Cờ lỗi riêng, không tái dùng `stats = { byCategory: [], byMonth: [] }`:
  // dữ liệu rỗng giả sẽ báo "chưa có dữ liệu" trong khi thật ra là fetch hỏng.
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    // `res.json<T>()` ở đây là generic của Cloudflare Workers (không phải DOM
    // chuẩn) — không truyền T thì suy luận ra `unknown`, phải chỉ rõ kiểu.
    fetch("/api/stats")
      .then((res) => res.json<Stats>())
      .then(setStats)
      .catch(() => setFailed(true));
  }, [reloadKey]);

  function handleRetry() {
    setFailed(false);
    setReloadKey((k) => k + 1);
  }

  if (failed) return <FetchError onRetry={handleRetry} />;

  if (stats === null) return <ChartsSkeleton />;

  if (stats.byCategory.length === 0) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">Chưa có dữ liệu để vẽ biểu đồ. Hãy nhập sao kê trước.</p>;
  }

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 font-semibold">Chi tiêu theo danh mục</h2>
        <CategoryChart data={stats.byCategory} />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 font-semibold">Chi tiêu và thu theo tháng</h2>
        <MonthChart data={stats.byMonth} />
      </div>
    </section>
  );
}
