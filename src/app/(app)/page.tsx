"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { OVERVIEW_DESCRIPTION } from "@/app/copy";
import { categoryChipStyle } from "@/app/colors";
import { FetchError } from "@/app/fetch-error";
import { formatDate } from "@/app/format";
import type { Insights } from "@/app/insights";
import { OverviewSkeleton } from "@/app/skeleton";

type Stats = {
  totals: { totalSpend: number; totalIncome: number; count: number };
  byCategory: { category: string; total: number }[];
  byMonth: { month: string; spend: number; income: number }[];
  cardPaymentsByMonth: { month: string; total: number }[];
};

type BudgetWithSpend = { category: string; monthlyLimit: number; currentMonthSpend: number };

type RecentTransaction = { id: number; date: string; description: string; amount: number; category: string };

function formatVnd(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);
}

/**
 * Trang "Tổng quan" — trang chủ (`/`). Ba thẻ đầu là tổng cả vòng đời (không
 * đổi thường xuyên); phần còn lại là các con số "ngay bây giờ" (tháng này,
 * dự đoán, cảnh báo, giao dịch gần đây) để trang chủ đáng xem hơn là quay lại
 * mỗi ngày — trước đây chỉ có ba thẻ tổng, không có lý do gì để ghé lại sau
 * lần xem đầu.
 */
export default function OverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [budgets, setBudgets] = useState<BudgetWithSpend[] | null>(null);
  const [recent, setRecent] = useState<RecentTransaction[] | null>(null);
  // `stats === null` vừa là "đang tải" vừa là "chưa có gì" — không phân biệt
  // được lỗi, mà fetch fail thì state không bao giờ đổi và skeleton chạy mãi.
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Gọi setState trong callback của `.then`, không gọi trực tiếp trong effect
  // (tránh cảnh báo react-hooks/set-state-in-effect).
  useEffect(() => {
    // `res.json<T>()` ở đây là generic của Cloudflare Workers (không phải DOM
    // chuẩn) — không truyền T thì suy luận ra `unknown`, phải chỉ rõ kiểu.
    fetch("/api/stats")
      .then((res) => res.json<Stats>())
      .then(setStats)
      .catch(() => setFailed(true));

    // Ba phần dưới là bổ trợ: fetch hỏng chỉ ẩn phần đó, không kéo cả trang
    // vào trạng thái lỗi (giống cách /charts xử lý insights).
    fetch("/api/insights")
      .then((res) => res.json<Insights>())
      .then(setInsights)
      .catch(() => {});
    fetch("/api/budgets")
      .then((res) => res.json<BudgetWithSpend[]>())
      .then(setBudgets)
      .catch(() => {});
    fetch("/api/transactions")
      .then((res) => res.json<RecentTransaction[]>())
      .then((rows) => setRecent(rows.slice(0, 5)))
      .catch(() => {});
  }, [reloadKey]);

  function handleRetry() {
    setFailed(false);
    setReloadKey((k) => k + 1);
  }

  if (failed) return <FetchError onRetry={handleRetry} />;
  if (!stats) return <OverviewSkeleton />;

  const currentMonthSpend = stats.byMonth.at(-1)?.spend ?? 0;
  const currentMonthCardPayment = stats.cardPaymentsByMonth[0]?.total ?? 0;
  const topCategory = stats.byCategory[0];
  const overBudget = (budgets ?? []).filter((b) => b.monthlyLimit > 0 && b.currentMonthSpend > b.monthlyLimit);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">{OVERVIEW_DESCRIPTION}</p>
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-3 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-xs text-zinc-500 sm:text-sm dark:text-zinc-400">Tổng chi tiêu</div>
            <div className="mt-1 text-base font-bold tabular-nums text-red-600 sm:text-2xl dark:text-red-400">
              {formatVnd(stats.totals.totalSpend)}
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-3 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-xs text-zinc-500 sm:text-sm dark:text-zinc-400">Tổng thu / hoàn tiền</div>
            <div className="mt-1 text-base font-bold tabular-nums text-green-700 sm:text-2xl dark:text-green-400">
              {formatVnd(stats.totals.totalIncome)}
            </div>
          </div>
          <div className="col-span-2 rounded-xl border border-zinc-200 bg-white p-3 sm:col-span-1 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-xs text-zinc-500 sm:text-sm dark:text-zinc-400">Số giao dịch</div>
            <div className="mt-1 text-lg font-bold tabular-nums sm:text-2xl">{stats.totals.count || 0}</div>
          </div>
        </section>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-500 dark:text-zinc-400">Tháng này</h2>
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-3 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-xs text-zinc-500 sm:text-sm dark:text-zinc-400">Đã chi tháng này</div>
            <div className="mt-1 text-base font-bold tabular-nums text-red-600 sm:text-xl dark:text-red-400">
              {formatVnd(currentMonthSpend)}
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-3 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-xs text-zinc-500 sm:text-sm dark:text-zinc-400">Dự đoán tháng tới</div>
            <div className="mt-1 text-base font-bold tabular-nums sm:text-xl">
              {insights ? formatVnd(insights.predictedNextMonthSpend) : "—"}
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-3 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-xs text-zinc-500 sm:text-sm dark:text-zinc-400">Đã trả vào thẻ</div>
            <div className="mt-1 text-base font-bold tabular-nums text-teal-600 sm:text-xl dark:text-teal-400">
              {formatVnd(currentMonthCardPayment)}
            </div>
          </div>
          <Link
            href="/charts"
            className={`rounded-xl border p-3 transition sm:p-5 ${
              overBudget.length > 0
                ? "border-red-200 bg-red-50 hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:hover:bg-red-900/60"
                : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            }`}
          >
            <div className="text-xs text-zinc-500 sm:text-sm dark:text-zinc-400">Ngân sách</div>
            <div
              className={`mt-1 text-base font-bold sm:text-xl ${
                overBudget.length > 0 ? "text-red-600 dark:text-red-400" : "text-teal-600 dark:text-teal-400"
              }`}
            >
              {budgets === null ? "—" : overBudget.length > 0 ? `${overBudget.length} vượt mức` : "Trong hạn mức"}
            </div>
          </Link>
        </section>
      </div>

      {topCategory && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">Danh mục chi nhiều nhất</h2>
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full px-2.5 py-1 text-sm font-medium" style={categoryChipStyle(topCategory.category)}>
              {topCategory.category}
            </span>
            <span className="text-lg font-bold tabular-nums">{formatVnd(topCategory.total)}</span>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Giao dịch gần đây</h2>
          <Link href="/transactions" className="text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-100">
            Xem tất cả
          </Link>
        </div>
        {recent === null ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Đang tải...</p>
        ) : recent.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Chưa có giao dịch nào. Hãy tải lên file sao kê PDF.</p>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
            {recent.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{t.description}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{formatDate(t.date)}</p>
                </div>
                <span
                  className={`shrink-0 text-sm font-semibold whitespace-nowrap ${
                    t.amount < 0 ? "text-red-600 dark:text-red-400" : "text-green-700 dark:text-green-400"
                  }`}
                >
                  {formatVnd(t.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
