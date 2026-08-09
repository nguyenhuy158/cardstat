import { NextRequest, NextResponse } from "next/server";
import { isResponse, requireUser } from "@/infrastructure/auth/require-user";
import { extractPdfText } from "@/infrastructure/parsing/pdf-text-extractor";
import { importStatement, EmptyStatementError } from "@/application/use-cases/import-statement";

export async function POST(req: NextRequest) {
  const authed = await requireUser(req);
  if (isResponse(authed)) return authed;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Thiếu file" }, { status: 400 });
  }
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Chỉ hỗ trợ file PDF" }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  try {
    const { inserted, skipped } = await importStatement(authed.repo, extractPdfText, buffer, file.name);
    // Đọc được giao dịch nhưng không có dòng nào mới (thường là nhập lại
    // đúng sao kê cũ) không phải là lỗi "không đọc được giao dịch nào" —
    // phải phân biệt rõ để người dùng không hiểu lầm là file hỏng.
    const message =
      inserted === 0 && skipped > 0
        ? "File này đã được nhập trước đó, không có giao dịch mới."
        : undefined;
    return NextResponse.json({ inserted, skipped, ...(message ? { message } : {}) });
  } catch (err) {
    if (err instanceof EmptyStatementError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
