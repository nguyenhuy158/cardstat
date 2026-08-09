import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { TransactionRepository } from "@/domain/ports/transaction-repository";
import { D1TransactionRepository } from "./d1-transaction-repository";

export function getTransactionRepository(): TransactionRepository {
  const { env } = getCloudflareContext();
  return new D1TransactionRepository(env.DB);
}
