import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { parseStatementCsv } from "@/lib/parseStatement";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Thiếu file" }, { status: 400 });
  }

  const text = await file.text();
  const rows = parseStatementCsv(text);

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "Không đọc được giao dịch nào từ file. Kiểm tra lại định dạng CSV." },
      { status: 400 }
    );
  }

  const insert = db.prepare(
    `INSERT INTO transactions (date, description, amount, category, source_file) VALUES (?, ?, ?, ?, ?)`
  );
  db.exec("BEGIN");
  try {
    for (const r of rows) {
      insert.run(r.date, r.description, r.amount, r.category, file.name);
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }

  return NextResponse.json({ inserted: rows.length });
}
