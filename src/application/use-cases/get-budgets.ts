import type { TransactionRepository } from "@/domain/ports/transaction-repository";

/** `month` mặc định là tháng hiện tại (giờ server, UTC — đủ dùng vì so sánh theo "YYYY-MM"). */
export async function getBudgets(repo: TransactionRepository, month?: string) {
  const targetMonth = month ?? new Date().toISOString().slice(0, 7);
  return repo.getBudgetsWithSpend(targetMonth);
}
