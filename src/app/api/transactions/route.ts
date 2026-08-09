import { NextRequest, NextResponse } from "next/server";
import { getTransactionRepository } from "@/infrastructure/persistence/get-repository";
import { listTransactions } from "@/application/use-cases/list-transactions";
import {
  createTransaction,
  InvalidTransactionError,
  type CreateTransactionInput,
} from "@/application/use-cases/create-transaction";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const repo = getTransactionRepository();
  const rows = await listTransactions(repo, {
    month: searchParams.get("month"),
    category: searchParams.get("category"),
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as CreateTransactionInput;
  const repo = getTransactionRepository();
  try {
    const id = await createTransaction(repo, body);
    return NextResponse.json({ id });
  } catch (err) {
    if (err instanceof InvalidTransactionError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
