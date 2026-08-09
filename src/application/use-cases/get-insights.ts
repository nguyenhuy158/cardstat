import type { TransactionRepository } from "@/domain/ports/transaction-repository";
import { buildInsights } from "@/domain/services/insights";

export async function getInsights(repo: TransactionRepository) {
  const transactions = await repo.list({});
  return buildInsights(transactions);
}
