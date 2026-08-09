import type { TransactionRepository } from "@/domain/ports/transaction-repository";

export type CreateTransactionInput = {
  date: string;
  description: string;
  amount: number;
  category?: string;
};

export class InvalidTransactionError extends Error {}

export async function createTransaction(repo: TransactionRepository, input: CreateTransactionInput) {
  const { date, description, amount } = input;
  if (!date || !description || amount === undefined) {
    throw new InvalidTransactionError("Thiếu dữ liệu");
  }
  return repo.create({ date, description, amount, category: input.category || "Khác" });
}
