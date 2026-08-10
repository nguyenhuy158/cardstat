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

// Neo cho thanh nhảy nhanh — id phải khớp với id gắn ở từng khối bên dưới.
// `scroll-mt-14` trên mỗi khối bù đúng chiều cao thanh nhảy sticky, không thì
// cuộn tới nơi sẽ bị thanh che mất phần đầu khối.
const JUMP_LINKS = [
  { id: "section-category", label: "Danh mục" },
  { id: "section-month", label: "Theo tháng" },
  { id: "section-insights", label: "Dự đoán & cảnh báo" },
  { id: "section-card-payments", label: "Đã trả vào thẻ" },
  { id: "section-budgets", label: "Ngân sách" },
];

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Thanh nhảy nhanh: trang này gộp nhiều khối (2 biểu đồ + 3 panel) nên trên
 * màn hình thấp phải cuộn khá dài mới thấy hết — bấm vào đây nhảy thẳng tới
 * khối muốn xem thay vì cuộn tay. Sticky trong vùng nội dung đang cuộn (xem
 * `(app)/layout.tsx`), không phải cuộn theo cửa sổ.
 */
function JumpNav() {
  return (
    <nav
      aria-label="Nhảy nhanh tới từng mục"
      className="sticky top-0 z-10 -mx-4 mb-4 flex gap-2 overflow-x-auto bg-zinc-50/95 px-4 py-2 backdrop-blur-sm sm:-mx-6 sm:px-6 dark:bg-zinc-950/95"
    >
      {JUMP_LINKS.map((link) => (
        <button
          key={link.id}
          type="button"
          onClick={() => scrollToSection(link.id)}
          className="shrink-0 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium whitespace-nowrap transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {link.label}
        </button>
      ))}
    </nav>
  );
}

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
    <>
      <JumpNav />
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div
          id="section-category"
          className="scroll-mt-14 rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h2 className="mb-4 font-semibold">Chi tiêu theo danh mục</h2>
          <CategoryChart data={stats.byCategory} />
        </div>

        <div
          id="section-month"
          className="scroll-mt-14 rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h2 className="mb-4 font-semibold">Chi tiêu và thu theo tháng</h2>
          <MonthChart data={stats.byMonth} />
        </div>

        <div id="section-insights" className="scroll-mt-14 lg:col-span-2">
          {insights === null ? <InsightsSkeleton /> : <InsightsPanel insights={insights} />}
        </div>

        <div id="section-card-payments" className="scroll-mt-14">
          <CardPaymentsPanel data={stats.cardPaymentsByMonth} />
        </div>

        <div id="section-budgets" className="scroll-mt-14 lg:col-span-2">
          <BudgetsPanel />
        </div>
      </section>
    </>
  );
}
