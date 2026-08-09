import { NextRequest, NextResponse } from "next/server";
import { isResponse, requireUser } from "@/infrastructure/auth/require-user";
import { listTransactions } from "@/application/use-cases/list-transactions";
import {
  createTransaction,
  InvalidTransactionError,
  type CreateTransactionInput,
} from "@/application/use-cases/create-transaction";

export async function GET(req: NextRequest) {
  const authed = await requireUser(req);
  if (isResponse(authed)) return authed;

  const { searchParams } = new URL(req.url);
  const rows = await listTransactions(authed.repo, {
    month: searchParams.get("month"),
    category: searchParams.get("category"),
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const authed = await requireUser(req);
  if (isResponse(authed)) return authed;

  const body = (await req.json()) as CreateTransactionInput;
  try {
    const id = await createTransaction(authed.repo, body);
    return NextResponse.json({ id });
  } catch (err) {
    if (err instanceof InvalidTransactionError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
