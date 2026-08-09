import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const category = searchParams.get("category");

  let query = "SELECT * FROM transactions WHERE 1=1";
  const params: (string | number)[] = [];
  if (month) {
    query += " AND date LIKE ?";
    params.push(`${month}%`);
  }
  if (category) {
    query += " AND category = ?";
    params.push(category);
  }
  query += " ORDER BY date DESC, id DESC";

  const rows = db.prepare(query).all(...params);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { date, description, amount, category } = body;
  if (!date || !description || amount === undefined) {
    return NextResponse.json({ error: "Thiếu dữ liệu" }, { status: 400 });
  }
  const info = db
    .prepare(`INSERT INTO transactions (date, description, amount, category) VALUES (?, ?, ?, ?)`)
    .run(date, description, amount, category || "Khác");
  return NextResponse.json({ id: info.lastInsertRowid });
}
