"use client";

import { useEffect, useMemo, useState } from "react";

import { CATEGORIES, OTHER_CATEGORY } from "@/domain/services/categorize";
import { categoryChipStyle } from "./colors";

type BudgetWithSpend = {
  category: string;
  monthlyLimit: number;
  currentMonthSpend: number;
};

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);
}

// Cùng thứ tự alphabet tiếng Việt như CategoryPicker, "Khác" ghim cuối — người
// dùng quen mắt với thứ tự này ở trang Giao dịch.
const EDITABLE_CATEGORIES = [...CATEGORIES]
  .filter((c) => c !== OTHER_CATEGORY)
  .sort((a, b) => a.localeCompare(b, "vi"))
  .concat(OTHER_CATEGORY);

function BudgetRow({
  category,
  budget,
  onSave,
}: {
  category: string;
  budget: BudgetWithSpend | undefined;
  onSave: (category: string, limit: number) => Promise<void>;
}) {
  const limit = budget?.monthlyLimit ?? 0;
  const spend = budget?.currentMonthSpend ?? 0;
  const [draft, setDraft] = useState(limit === 0 ? "" : String(limit));
  const [saving, setSaving] = useState(false);

  const percent = limit > 0 ? Math.min(100, Math.round((spend / limit) * 100)) : null;
  const over = limit > 0 && spend > limit;

  async function handleBlur() {
    const parsed = draft.trim() === "" ? 0 : Number(draft);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed === limit) return;

    setSaving(true);
    try {
      await onSave(category, parsed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="py-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={categoryChipStyle(category)}>
          {category}
        </span>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={50000}
            placeholder="Chưa đặt"
            aria-label={`Ngân sách/tháng cho ${category}`}
            value={draft}
            disabled={saving}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            className="w-28 rounded-md border border-zinc-200 bg-transparent px-2 py-1 text-right text-sm outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/40 disabled:opacity-60 dark:border-zinc-700 dark:focus-visible:ring-zinc-100/40"
          />
          <span className="text-xs text-zinc-500 dark:text-zinc-400">đ</span>
        </div>
      </div>

      {limit > 0 && (
        <>
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div
              className={`h-1.5 rounded-full ${over ? "bg-red-600 dark:bg-red-500" : "bg-teal-600 dark:bg-teal-500"}`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className={`mt-1 text-xs ${over ? "text-red-600 dark:text-red-400" : "text-zinc-500 dark:text-zinc-400"}`}>
            {formatCurrency(spend)} / {formatCurrency(limit)}
            {over && " — đã vượt ngân sách"}
          </p>
        </>
      )}
    </li>
  );
}

/** Khu vực "Ngân sách theo danh mục" trên trang Biểu đồ — đặt hạn mức/tháng, theo dõi tiến độ. */
export function BudgetsPanel() {
  const [budgets, setBudgets] = useState<BudgetWithSpend[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/budgets")
      .then((res) => res.json<BudgetWithSpend[]>())
      .then(setBudgets)
      .catch(() => setFailed(true));
  }, []);

  const byCategory = useMemo(() => {
    const map = new Map<string, BudgetWithSpend>();
    for (const b of budgets ?? []) map.set(b.category, b);
    return map;
  }, [budgets]);

  async function handleSave(category: string, limit: number) {
    const res = await fetch("/api/budgets", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, limit }),
    });
    if (!res.ok) return;

    setBudgets((prev) => {
      const next = (prev ?? []).filter((b) => b.category !== category);
      if (limit > 0) {
        const existing = (prev ?? []).find((b) => b.category === category);
        next.push({ category, monthlyLimit: limit, currentMonthSpend: existing?.currentMonthSpend ?? 0 });
      }
      return next;
    });
  }

  if (failed) return null;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-1 font-semibold">Ngân sách theo danh mục</h2>
      <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
        Đặt hạn mức chi tiêu/tháng cho từng danh mục — để trống nghĩa là không theo dõi.
      </p>
      {budgets === null ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Đang tải...</p>
      ) : (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
          {EDITABLE_CATEGORIES.map((category) => {
            const budget = byCategory.get(category);
            // Key kèm monthlyLimit: remount row (reset state `draft`) khi
            // giá trị lưu ở server đổi, thay vì đồng bộ bằng setState trong
            // effect (gây cascading render, ESLint react-hooks chặn).
            return (
              <BudgetRow
                key={`${category}-${budget?.monthlyLimit ?? 0}`}
                category={category}
                budget={budget}
                onSave={handleSave}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}
