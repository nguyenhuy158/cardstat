"use client";

import { useEffect, useState } from "react";

import { OVERVIEW_DESCRIPTION } from "@/app/copy";
import { FetchError } from "@/app/fetch-error";
import { OverviewSkeleton } from "@/app/skeleton";

type Stats = {
  totals: { totalSpend: number; totalIncome: number; count: number };
};

function formatVnd(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);
}

/**
 * Trang "Tổng quan" — trang chủ (`/`). Chỉ hiển thị các thẻ tổng hợp; biểu đồ
 * và bảng giao dịch nằm ở route riêng (`/charts`, `/transactions`).
 */
export default function OverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
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
  }, [reloadKey]);

  function handleRetry() {
    setFailed(false);
    setReloadKey((k) => k + 1);
  }

  return (
    <>
      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">{OVERVIEW_DESCRIPTION}</p>

      {failed ? (
        <FetchError onRetry={handleRetry} />
      ) : stats ? (
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
      ) : (
        <OverviewSkeleton />
      )}
    </>
  );
}
