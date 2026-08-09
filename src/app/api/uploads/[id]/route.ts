import { NextRequest, NextResponse } from "next/server";
import { isResponse, requireUser } from "@/infrastructure/auth/require-user";
import { deleteUpload } from "@/application/use-cases/delete-upload";
import { parseId } from "../../parse-id";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authed = await requireUser(req);
  if (isResponse(authed)) return authed;

  const { id } = await params;
  const parsedId = parseId(id);
  if (parsedId === null) return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });

  const { found, deletedTransactions } = await deleteUpload(authed.repo, parsedId);
  if (!found) {
    return NextResponse.json({ error: "Không tìm thấy lần nhập này" }, { status: 404 });
  }
  return NextResponse.json({ deleted: deletedTransactions });
}
