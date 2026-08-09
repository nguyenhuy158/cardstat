import { getCloudflareContext } from "@opennextjs/cloudflare";

import type { TransactionRepository } from "@/domain/ports/transaction-repository";
import { D1TransactionRepository } from "./d1-transaction-repository";

/** Repo luôn gắn với một user; không có biến thể "xem tất cả". */
export async function getTransactionRepository(userId: string): Promise<TransactionRepository> {
  const { env } = await getCloudflareContext({ async: true });
  return new D1TransactionRepository(env.DB, userId);
}
