import { NextRequest, NextResponse } from "next/server";
import { getTransactionRepository } from "@/infrastructure/persistence/get-repository";
import { deleteTransaction } from "@/application/use-cases/delete-transaction";
import { updateTransaction, NoFieldsToUpdateError } from "@/application/use-cases/update-transaction";
import type { TransactionUpdate } from "@/domain/entities/transaction";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repo = getTransactionRepository();
  await deleteTransaction(repo, Number(id));
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json()) as TransactionUpdate;
  const repo = getTransactionRepository();
  try {
    await updateTransaction(repo, Number(id), body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof NoFieldsToUpdateError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
