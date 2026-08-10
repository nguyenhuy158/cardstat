import { formatMonth } from "./format";

export type CardPaymentMonth = { month: string; total: number };

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);
}

/**
 * Bảng "Đã trả vào thẻ theo tháng" trên trang Biểu đồ — chỉ tính giao dịch
 * thuộc danh mục "Thanh toán thẻ" (amount > 0), KHÁC với `income` trong biểu
 * đồ tháng ở trên (income gồm mọi khoản tiền vào, kể cả hoàn tiền/chuyển
 * khoản khác không phải trả nợ thẻ).
 */
export function CardPaymentsPanel({ data }: { data: CardPaymentMonth[] }) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-1 font-semibold">Đã trả vào thẻ theo tháng</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Chưa có giao dịch nào ở danh mục &quot;Thanh toán thẻ&quot;.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-2 font-semibold">Đã trả vào thẻ theo tháng</h2>
      <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
        {data.map((row) => (
          <li key={row.month} className="flex items-center justify-between gap-3 py-2">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">{formatMonth(row.month)}</span>
            <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">{formatCurrency(row.total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
