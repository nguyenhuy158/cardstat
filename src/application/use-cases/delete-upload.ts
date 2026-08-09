import type { DeleteUploadResult } from "@/domain/entities/upload";
import type { TransactionRepository } from "@/domain/ports/transaction-repository";

/** Xóa một lần nhập kèm toàn bộ giao dịch của nó. */
export function deleteUpload(repo: TransactionRepository, id: number): Promise<DeleteUploadResult> {
  return repo.deleteUpload(id);
}
