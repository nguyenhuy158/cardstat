import type { TransactionRepository } from "@/domain/ports/transaction-repository";

export function deleteTransaction(repo: TransactionRepository, id: number) {
  return repo.delete(id);
}
