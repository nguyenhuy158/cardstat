"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { authClient } from "@/infrastructure/auth/auth-client";

import { CategoryChart, MonthChart } from "./charts";
import { TransactionsTable, type Transaction } from "./transactions-table";

type Stats = {
  byCategory: { category: string; total: number }[];
  byMonth: { month: string; spend: number; income: number }[];
  totals: { totalSpend: number; totalIncome: number; count: number };
  months: { month: string }[];
  categories: { category: string }[];
};

// Hằng số module-scope: giữ tham chiếu ổn định giữa các lần render để không
// làm hỏng memoization của TransactionsTable khi chưa có `stats`.
const EMPTY_MONTHS: { month: string }[] = [];
const EMPTY_CATEGORIES: { category: string }[] = [];
Object.freeze(EMPTY_MONTHS);
Object.freeze(EMPTY_CATEGORIES);

function formatVnd(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);
}

export default function Home() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const signedIn = Boolean(session?.user);
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

  // Chưa đăng nhập thì mọi route /api đều trả 401 — đẩy thẳng sang /login.
  useEffect(() => {
    if (!sessionPending && !signedIn) router.replace("/login");
  }, [sessionPending, signedIn, router]);

  useEffect(() => {
    if (signedIn) loadStats();
  }, [signedIn]);

  useEffect(() => {
    if (signedIn) loadTransactions();
  }, [signedIn, monthFilter, categoryFilter]);

  async function handleSignOut() {
    await authClient.signOut();
    router.replace("/login");
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = (await res.json()) as { error?: string; inserted?: number };
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

  if (sessionPending || !signedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-500 dark:bg-zinc-950">
        Đang kiểm tra đăng nhập...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Thanh header sticky gọn cho mobile: tiêu đề bên trái, người dùng + đăng xuất bên phải */}
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-zinc-50/95 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="mx-auto flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:max-w-5xl">
          <h1 className="min-w-0 truncate text-base font-bold sm:text-xl">
            Thống kê chi tiêu thẻ tín dụng
          </h1>
          <div className="flex min-w-0 shrink-0 items-center gap-2 text-sm">
            <span className="max-w-[6rem] truncate text-zinc-500 sm:max-w-[10rem]">
              {session?.user.displayUsername || session?.user.name}
            </span>
            <button
              onClick={handleSignOut}
              className="flex h-11 items-center rounded-lg border border-zinc-200 px-3 font-medium transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:max-w-5xl">
        <p className="mb-6 text-sm text-zinc-500">
          Import sao kê PDF, tự động phân loại và xem thống kê chi tiêu
        </p>

        {/* Upload */}
        <section className="mb-6 rounded-xl border border-zinc-200 bg-white p-4 sm:mb-8 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 font-semibold">Nhập sao kê (PDF)</h2>
          <label
            className={`flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 text-sm font-medium text-zinc-600 transition hover:border-zinc-400 hover:bg-zinc-50 focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-900/20 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 dark:focus-within:ring-zinc-100/20 ${uploading ? "pointer-events-none opacity-60" : ""}`}
          >
            {uploading ? "Đang xử lý..." : "Chạm để chọn file PDF sao kê"}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleUpload}
              disabled={uploading}
              className="sr-only"
            />
          </label>
          {message && <p className="mt-3 text-sm">{message}</p>}
          <p className="mt-3 text-xs text-zinc-400">
            Hỗ trợ file PDF sao kê ngân hàng/thẻ tín dụng. Hệ thống tự dò từng dòng có ngày và số tiền để nhận diện giao dịch.
          </p>
        </section>

        {/* Summary cards */}
        {stats && (
          <section className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:grid-cols-3 sm:gap-4">
            <div className="rounded-xl border border-zinc-200 bg-white p-3 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-xs text-zinc-500 sm:text-sm">Tổng chi tiêu</div>
              <div className="mt-1 text-base font-bold tabular-nums text-red-500 sm:text-2xl">
                {formatVnd(stats.totals.totalSpend)}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-3 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-xs text-zinc-500 sm:text-sm">Tổng thu / hoàn tiền</div>
              <div className="mt-1 text-base font-bold tabular-nums text-green-500 sm:text-2xl">
                {formatVnd(stats.totals.totalIncome)}
              </div>
            </div>
            <div className="col-span-2 rounded-xl border border-zinc-200 bg-white p-3 sm:col-span-1 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-xs text-zinc-500 sm:text-sm">Số giao dịch</div>
              <div className="mt-1 text-lg font-bold tabular-nums sm:text-2xl">{stats.totals.count || 0}</div>
            </div>
          </section>
        )}

        {/* Charts */}
        {stats && stats.byCategory.length > 0 && (
          <section className="mb-6 grid grid-cols-1 gap-4 sm:mb-8 lg:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 font-semibold">Chi tiêu theo danh mục</h2>
              <CategoryChart data={stats.byCategory} />
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 font-semibold">Chi tiêu và thu theo tháng</h2>
              <MonthChart data={stats.byMonth} />
            </div>
          </section>
        )}

        {/* Bảng giao dịch: bộ lọc + ô tìm kiếm nằm trong TransactionsTable */}
        <section className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 font-semibold">Danh sách giao dịch</h2>

          <TransactionsTable
            data={transactions}
            onDelete={handleDelete}
            months={stats?.months ?? EMPTY_MONTHS}
            categories={stats?.categories ?? EMPTY_CATEGORIES}
            monthFilter={monthFilter}
            onMonthFilterChange={setMonthFilter}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
          />
        </section>
      </div>
    </div>
  );
}
