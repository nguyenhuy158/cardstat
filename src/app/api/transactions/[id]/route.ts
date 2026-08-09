import { NextRequest, NextResponse } from "next/server";
import { isResponse, requireUser } from "@/infrastructure/auth/require-user";
import { deleteTransaction } from "@/application/use-cases/delete-transaction";
import { updateTransaction, NoFieldsToUpdateError } from "@/application/use-cases/update-transaction";
import type { TransactionUpdate } from "@/domain/entities/transaction";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authed = await requireUser(req);
  if (isResponse(authed)) return authed;

  const { id } = await params;
  await deleteTransaction(authed.repo, Number(id));
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authed = await requireUser(req);
  if (isResponse(authed)) return authed;

  const { id } = await params;
  const body = (await req.json()) as TransactionUpdate;
  try {
    await updateTransaction(authed.repo, Number(id), body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof NoFieldsToUpdateError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
