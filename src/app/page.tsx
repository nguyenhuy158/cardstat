"use client";

import { useEffect, useRef, useState } from "react";

type Transaction = {
  id: number;
  date: string;
  description: string;
  amount: number;
  category: string;
};

type Stats = {
  byCategory: { category: string; total: number }[];
  byMonth: { month: string; spend: number; income: number }[];
  totals: { totalSpend: number; totalIncome: number; count: number };
  months: { month: string }[];
  categories: { category: string }[];
};

const CATEGORY_COLORS: Record<string, string> = {
  "Ăn uống": "#f97316",
  "Di chuyển": "#3b82f6",
  "Mua sắm": "#ec4899",
  "Giải trí": "#a855f7",
  "Hóa đơn": "#eab308",
  "Du lịch": "#06b6d4",
  "Sức khỏe": "#22c55e",
  "Rút tiền / Phí": "#ef4444",
  Khác: "#6b7280",
};

function formatVnd(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthFilter, setMonthFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadStats() {
    const res = await fetch("/api/stats");
    setStats(await res.json());
  }

  async function loadTransactions() {
    const params = new URLSearchParams();
    if (monthFilter) params.set("month", monthFilter);
    if (categoryFilter) params.set("category", categoryFilter);
    const res = await fetch(`/api/transactions?${params}`);
    setTransactions(await res.json());
  }

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [monthFilter, categoryFilter]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setMessage(`Lỗi: ${data.error}`);
      } else {
        setMessage(`Đã nhập ${data.inserted} giao dịch từ ${file.name}`);
        await loadStats();
        await loadTransactions();
      }
    } catch {
      setMessage("Lỗi khi tải file lên");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(id: number) {
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    await loadStats();
    await loadTransactions();
  }

  const maxCategory = stats?.byCategory.reduce((m, c) => Math.max(m, c.total), 0) || 1;
  const maxMonth = stats?.byMonth.reduce((m, c) => Math.max(m, c.spend), 0) || 1;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <header className="mb-8 flex flex-col gap-1">
          <h1 className="text-2xl font-bold">Thống kê chi tiêu thẻ tín dụng</h1>
          <p className="text-sm text-zinc-500">Import sao kê CSV, tự động phân loại và xem thống kê chi tiêu</p>
        </header>

        {/* Upload */}
        <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 font-semibold">Nhập sao kê (CSV)</h2>
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleUpload}
              disabled={uploading}
              className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-700 dark:file:bg-zinc-100 dark:file:text-zinc-900"
            />
            {uploading && <span className="text-sm text-zinc-500">Đang xử lý...</span>}
          </div>
          {message && <p className="mt-3 text-sm">{message}</p>}
          <p className="mt-3 text-xs text-zinc-400">
            Hỗ trợ file CSV có cột ngày / mô tả / số tiền (hoặc ghi nợ-ghi có riêng). Hệ thống tự nhận diện tên cột tiếng Anh hoặc tiếng Việt.
          </p>
        </section>

        {/* Summary cards */}
        {stats && (
          <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-sm text-zinc-500">Tổng chi tiêu</div>
              <div className="mt-1 text-2xl font-bold text-red-500">
                {formatVnd(stats.totals.totalSpend)}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-sm text-zinc-500">Tổng thu / hoàn tiền</div>
              <div className="mt-1 text-2xl font-bold text-green-500">
                {formatVnd(stats.totals.totalIncome)}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-sm text-zinc-500">Số giao dịch</div>
              <div className="mt-1 text-2xl font-bold">{stats.totals.count || 0}</div>
            </div>
          </section>
        )}

        {/* Charts */}
        {stats && stats.byCategory.length > 0 && (
          <section className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 font-semibold">Chi tiêu theo danh mục</h2>
              <div className="flex flex-col gap-3">
                {stats.byCategory.filter((c) => c.total > 0).map((c) => (
                  <div key={c.category}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{c.category}</span>
                      <span className="text-zinc-500">{formatVnd(c.total)}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${(c.total / maxCategory) * 100}%`,
                          backgroundColor: CATEGORY_COLORS[c.category] || "#6b7280",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 font-semibold">Chi tiêu theo tháng</h2>
              <div className="flex h-48 items-end gap-2">
                {stats.byMonth.map((m) => (
                  <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-zinc-900 dark:bg-zinc-100"
                      style={{ height: `${Math.max((m.spend / maxMonth) * 100, 2)}%` }}
                      title={formatVnd(m.spend)}
                    />
                    <span className="text-[10px] text-zinc-500">{m.month.slice(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Filters + table */}
        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold">Danh sách giao dịch</h2>
            <div className="flex gap-2">
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              >
                <option value="">Tất cả tháng</option>
                {stats?.months.map((m) => (
                  <option key={m.month} value={m.month}>{m.month}</option>
                ))}
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              >
                <option value="">Tất cả danh mục</option>
                {stats?.categories.map((c) => (
                  <option key={c.category} value={c.category}>{c.category}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-800">
                  <th className="py-2 pr-3">Ngày</th>
                  <th className="py-2 pr-3">Mô tả</th>
                  <th className="py-2 pr-3">Danh mục</th>
                  <th className="py-2 pr-3 text-right">Số tiền</th>
                  <th className="py-2 pr-3"></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b border-zinc-100 dark:border-zinc-800/50">
                    <td className="py-2 pr-3 whitespace-nowrap">{t.date}</td>
                    <td className="py-2 pr-3">{t.description}</td>
                    <td className="py-2 pr-3">
                      <span
                        className="rounded-full px-2 py-0.5 text-xs text-white"
                        style={{ backgroundColor: CATEGORY_COLORS[t.category] || "#6b7280" }}
                      >
                        {t.category}
                      </span>
                    </td>
                    <td className={`py-2 pr-3 text-right whitespace-nowrap ${t.amount < 0 ? "text-red-500" : "text-green-500"}`}>
                      {formatVnd(t.amount)}
                    </td>
                    <td className="py-2 pr-3 text-right">
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="text-xs text-zinc-400 hover:text-red-500"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-400">
                      Chưa có giao dịch nào. Hãy tải lên file sao kê CSV ở trên.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
