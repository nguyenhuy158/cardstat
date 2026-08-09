import { categoryChipStyle } from "./colors";
import { formatDate } from "./format";

type CategoryAlert = {
  category: string;
  currentMonthTotal: number;
  averagePastMonths: number;
  changeRatio: number;
};

type InstallmentPlan = {
  key: string;
  description: string;
  monthlyAmount: number;
  paidInstallments: number;
  totalInstallments: number | null;
  firstDate: string;
  lastDate: string;
  paidTotal: number;
};

export type Insights = {
  predictedNextMonthSpend: number;
  categoryAlerts: CategoryAlert[];
  installmentPlans: InstallmentPlan[];
};

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);
}

function AlertRow({ alert }: { alert: CategoryAlert }) {
  const up = alert.changeRatio > 0;
  return (
    <li className="flex items-center justify-between gap-3 py-1.5">
      <span
        className="rounded-full px-2 py-0.5 text-xs font-medium"
        style={categoryChipStyle(alert.category)}
      >
        {alert.category}
      </span>
      <span className={`text-sm font-medium ${up ? "text-red-600 dark:text-red-400" : "text-teal-600 dark:text-teal-400"}`}>
        {up ? "+" : ""}
        {Math.round(alert.changeRatio * 100)}% so với trung bình
      </span>
    </li>
  );
}

function InstallmentRow({ plan }: { plan: InstallmentPlan }) {
  const percent = plan.totalInstallments ? Math.min(100, Math.round((plan.paidInstallments / plan.totalInstallments) * 100)) : null;
  return (
    <li className="py-2">
      <div className="flex items-center justify-between gap-3">
        <span className="truncate text-sm font-medium">{plan.description}</span>
        <span className="whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
          {plan.totalInstallments ? `${plan.paidInstallments}/${plan.totalInstallments} kỳ` : `${plan.paidInstallments} kỳ`}
        </span>
      </div>
      {percent !== null && (
        <div className="mt-1 h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div className="h-1.5 rounded-full bg-teal-600 dark:bg-teal-500" style={{ width: `${percent}%` }} />
        </div>
      )}
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        {formatCurrency(plan.monthlyAmount)}/kỳ · đã trả {formatCurrency(plan.paidTotal)} · kỳ gần nhất {formatDate(plan.lastDate)}
      </p>
    </li>
  );
}

/** Khu vực "Dự đoán & Insight" trên trang Biểu đồ — dự đoán chi tiêu, cảnh báo danh mục bất thường, tiến độ trả góp. */
export function InsightsPanel({ insights }: { insights: Insights }) {
  const { predictedNextMonthSpend, categoryAlerts, installmentPlans } = insights;

  if (predictedNextMonthSpend === 0 && categoryAlerts.length === 0 && installmentPlans.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-1 font-semibold">Dự đoán chi tiêu tháng tới</h2>
        <p className="text-2xl font-bold">{formatCurrency(predictedNextMonthSpend)}</p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Trung bình chi tiêu các tháng gần nhất</p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-2 font-semibold">Cảnh báo danh mục</h2>
        {categoryAlerts.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Không có danh mục nào lệch bất thường.</p>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
            {categoryAlerts.slice(0, 5).map((a) => (
              <AlertRow key={a.category} alert={a} />
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-2 font-semibold">Trả góp đang theo dõi</h2>
        {installmentPlans.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Không có khoản trả góp nào.</p>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
            {installmentPlans.map((p) => (
              <InstallmentRow key={p.key} plan={p} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
