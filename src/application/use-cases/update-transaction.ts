import type { TransactionRepository } from "@/domain/ports/transaction-repository";
import type { TransactionUpdate } from "@/domain/entities/transaction";

export class NoFieldsToUpdateError extends Error {}

export async function updateTransaction(repo: TransactionRepository, id: number, update: TransactionUpdate) {
  if (Object.keys(update).length === 0) {
    throw new NoFieldsToUpdateError("Không có gì để cập nhật");
  }
  await repo.update(id, update);
}
