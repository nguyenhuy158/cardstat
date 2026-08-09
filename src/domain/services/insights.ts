import type { CategoryAlert, InstallmentPlan, Insights, Transaction } from "../entities/transaction";

const INSTALLMENT_CATEGORY = "Trả góp";
const SEQUENCE_RE = /(\d+)\s*\/\s*(\d+)\s*$/;
const ALERT_THRESHOLD = 0.3;

function monthOf(date: string): string {
  return date.slice(0, 7);
}

function installmentKey(description: string): string {
  return description.replace(SEQUENCE_RE, "").trim();
}

/** Gộp các dòng "Trả góp" cùng gốc mô tả thành từng kế hoạch, suy ra tổng kỳ nếu mô tả có ghi "x/y". */
function buildInstallmentPlans(transactions: Transaction[]): InstallmentPlan[] {
  const groups = new Map<string, Transaction[]>();
  for (const t of transactions) {
    if (t.category !== INSTALLMENT_CATEGORY) continue;
    const key = installmentKey(t.description);
    const group = groups.get(key) ?? [];
    group.push(t);
    groups.set(key, group);
  }

  const plans: InstallmentPlan[] = [];
  for (const [key, rows] of groups) {
    rows.sort((a, b) => a.date.localeCompare(b.date));
    let totalInstallments: number | null = null;
    for (const row of rows) {
      const m = row.description.match(SEQUENCE_RE);
      if (m) {
        totalInstallments = Number(m[2]);
        break;
      }
    }
    const paidTotal = rows.reduce((sum, r) => sum + Math.abs(r.amount), 0);
    plans.push({
      key,
      description: rows[0].description.replace(SEQUENCE_RE, "").trim() || rows[0].description,
      monthlyAmount: Math.abs(rows[rows.length - 1].amount),
      paidInstallments: rows.length,
      totalInstallments,
      firstDate: rows[0].date,
      lastDate: rows[rows.length - 1].date,
      paidTotal,
    });
  }

  return plans.sort((a, b) => b.lastDate.localeCompare(a.lastDate));
}

/** Dự đoán chi tiêu tháng tới = trung bình chi tiêu của các tháng đã hoàn tất trước tháng hiện tại (tối đa 3 tháng gần nhất). */
function predictNextMonthSpend(transactions: Transaction[]): number {
  const spendByMonth = new Map<string, number>();
  for (const t of transactions) {
    if (t.amount >= 0) continue;
    const month = monthOf(t.date);
    spendByMonth.set(month, (spendByMonth.get(month) ?? 0) + Math.abs(t.amount));
  }

  const months = [...spendByMonth.keys()].sort();
  if (months.length === 0) return 0;

  const currentMonth = months[months.length - 1];
  const pastMonths = months.filter((m) => m !== currentMonth).slice(-3);
  if (pastMonths.length === 0) return spendByMonth.get(currentMonth) ?? 0;

  const total = pastMonths.reduce((sum, m) => sum + (spendByMonth.get(m) ?? 0), 0);
  return total / pastMonths.length;
}

/** So chi tiêu tháng hiện tại của mỗi danh mục với trung bình các tháng trước, báo lệch trên ngưỡng 30%. */
function buildCategoryAlerts(transactions: Transaction[]): CategoryAlert[] {
  const byMonthCategory = new Map<string, Map<string, number>>();
  for (const t of transactions) {
    if (t.amount >= 0) continue;
    const month = monthOf(t.date);
    const perCategory = byMonthCategory.get(month) ?? new Map<string, number>();
    perCategory.set(t.category, (perCategory.get(t.category) ?? 0) + Math.abs(t.amount));
    byMonthCategory.set(month, perCategory);
  }

  const months = [...byMonthCategory.keys()].sort();
  if (months.length < 2) return [];

  const currentMonth = months[months.length - 1];
  const pastMonths = months.slice(0, -1);
  const currentTotals = byMonthCategory.get(currentMonth) ?? new Map<string, number>();

  const alerts: CategoryAlert[] = [];
  for (const [category, currentMonthTotal] of currentTotals) {
    const pastSum = pastMonths.reduce((sum, m) => sum + (byMonthCategory.get(m)?.get(category) ?? 0), 0);
    const monthsWithData = pastMonths.filter((m) => (byMonthCategory.get(m)?.get(category) ?? 0) > 0).length;
    if (monthsWithData === 0) continue;

    const averagePastMonths = pastSum / monthsWithData;
    if (averagePastMonths === 0) continue;

    const changeRatio = (currentMonthTotal - averagePastMonths) / averagePastMonths;
    if (Math.abs(changeRatio) >= ALERT_THRESHOLD) {
      alerts.push({ category, currentMonthTotal, averagePastMonths, changeRatio });
    }
  }

  return alerts.sort((a, b) => Math.abs(b.changeRatio) - Math.abs(a.changeRatio));
}

export function buildInsights(transactions: Transaction[]): Insights {
  return {
    predictedNextMonthSpend: predictNextMonthSpend(transactions),
    categoryAlerts: buildCategoryAlerts(transactions),
    installmentPlans: buildInstallmentPlans(transactions),
  };
}
