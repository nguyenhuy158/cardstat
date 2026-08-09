import { NextRequest, NextResponse } from "next/server";
import { getTransactionRepository } from "@/infrastructure/persistence/get-repository";
import { extractPdfText } from "@/infrastructure/parsing/pdf-text-extractor";
import { importStatement, EmptyStatementError } from "@/application/use-cases/import-statement";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Thiếu file" }, { status: 400 });
  }
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Chỉ hỗ trợ file PDF" }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const repo = getTransactionRepository();
  try {
    const inserted = await importStatement(repo, extractPdfText, buffer, file.name);
    return NextResponse.json({ inserted });
  } catch (err) {
    if (err instanceof EmptyStatementError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
