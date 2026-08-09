import { NextRequest, NextResponse } from "next/server";
import { isResponse, requireUser } from "@/infrastructure/auth/require-user";
import { deleteTransaction } from "@/application/use-cases/delete-transaction";
import {
  updateTransaction,
  InvalidUpdateError,
  NoFieldsToUpdateError,
} from "@/application/use-cases/update-transaction";
import { parseId } from "../../parse-id";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authed = await requireUser(req);
  if (isResponse(authed)) return authed;

  const { id } = await params;
  const parsedId = parseId(id);
  if (parsedId === null) return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });

  await deleteTransaction(authed.repo, parsedId);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authed = await requireUser(req);
  if (isResponse(authed)) return authed;

  const { id } = await params;
  const parsedId = parseId(id);
  if (parsedId === null) return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body không phải JSON hợp lệ" }, { status: 400 });
  }

  try {
    await updateTransaction(authed.repo, parsedId, body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof NoFieldsToUpdateError || err instanceof InvalidUpdateError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
