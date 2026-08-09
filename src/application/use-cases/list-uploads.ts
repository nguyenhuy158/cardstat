import type { Upload } from "@/domain/entities/upload";
import type { TransactionRepository } from "@/domain/ports/transaction-repository";

export function listUploads(repo: TransactionRepository): Promise<Upload[]> {
  return repo.listUploads();
}
