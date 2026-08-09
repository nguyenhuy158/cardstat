import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const byCategory = db
    .prepare(
      `SELECT category, SUM(CASE WHEN amount < 0 THEN -amount ELSE 0 END) as total
       FROM transactions GROUP BY category ORDER BY total DESC`
    )
    .all();

  const byMonth = db
    .prepare(
      `SELECT substr(date, 1, 7) as month,
              SUM(CASE WHEN amount < 0 THEN -amount ELSE 0 END) as spend,
              SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as income
       FROM transactions GROUP BY month ORDER BY month ASC`
    )
    .all();

  const totals = db
    .prepare(
      `SELECT
        SUM(CASE WHEN amount < 0 THEN -amount ELSE 0 END) as totalSpend,
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as totalIncome,
        COUNT(*) as count
       FROM transactions`
    )
    .get();

  const months = db
    .prepare(`SELECT DISTINCT substr(date, 1, 7) as month FROM transactions ORDER BY month DESC`)
    .all();

  const categories = db
    .prepare(`SELECT DISTINCT category FROM transactions ORDER BY category ASC`)
    .all();

  return NextResponse.json({ byCategory, byMonth, totals, months, categories });
}
