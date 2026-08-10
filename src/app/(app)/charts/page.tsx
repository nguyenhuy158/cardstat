"use client";

import { useEffect, useState } from "react";

import { BudgetsPanel } from "@/app/budgets";
import { CardPaymentsPanel, type CardPaymentMonth } from "@/app/card-payments";
import { CategoryChart, MonthChart } from "@/app/charts";
import { FetchError } from "@/app/fetch-error";
import { InsightsPanel, type Insights } from "@/app/insights";
import { ChartsSkeleton, InsightsSkeleton } from "@/app/skeleton";

type Stats = {
  byCategory: { category: string; total: number }[];
  byMonth: { month: string; spend: number; income: number }[];
  cardPaymentsByMonth: CardPaymentMonth[];
};

/** Trang "Biểu đồ" (`/charts`) — hai biểu đồ và khu vực Dự đoán & Insight, mỗi phần tự fetch API riêng. */
export default function ChartsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
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

    // Insight là phần bổ trợ: fetch hỏng chỉ ẩn khu vực này, không kéo cả
    // trang vào trạng thái lỗi (hai biểu đồ chính vẫn dùng được).
    fetch("/api/insights")
      .then((res) => res.json<Insights>())
      .then(setInsights)
      .catch(() => {});
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

      <div className="lg:col-span-2">{insights === null ? <InsightsSkeleton /> : <InsightsPanel insights={insights} />}</div>

      <CardPaymentsPanel data={stats.cardPaymentsByMonth} />

      <div className="lg:col-span-2">
        <BudgetsPanel />
      </div>
    </section>
  );
}
