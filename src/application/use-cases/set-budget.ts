import type { TransactionRepository } from "@/domain/ports/transaction-repository";

export async function setBudget(repo: TransactionRepository, category: string, limit: number) {
  await repo.setBudget(category, limit);
}
