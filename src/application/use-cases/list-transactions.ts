import type { TransactionRepository } from "@/domain/ports/transaction-repository";
import type { TransactionFilter } from "@/domain/entities/transaction";

export function listTransactions(repo: TransactionRepository, filter: TransactionFilter) {
  return repo.list(filter);
}
