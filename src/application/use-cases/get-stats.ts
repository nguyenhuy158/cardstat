import type { TransactionRepository } from "@/domain/ports/transaction-repository";

export function getStats(repo: TransactionRepository) {
  return repo.getStats();
}
