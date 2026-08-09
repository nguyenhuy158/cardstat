import Papa from "papaparse";
import { autoCategorize } from "./categorize";

export type ParsedRow = {
  date: string;
  description: string;
  amount: number;
  category: string;
};

function findKey(keys: string[], candidates: string[]): string | undefined {
  const norm = (s: string) => s.toLowerCase().trim();
  return keys.find((k) => candidates.some((c) => norm(k).includes(c)));
}

function parseDate(raw: string): string {
  const s = raw.trim();
  const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (dmy) {
    let [, d, m, y] = dmy;
    if (y.length === 2) y = "20" + y;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const ymd = s.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (ymd) {
    const [, y, m, d] = ymd;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return s;
}

function parseAmount(raw: string): number {
  if (!raw) return 0;
  let s = raw.trim().replace(/"/g, "");
  const negative = /^\(.*\)$/.test(s) || s.trim().startsWith("-");
  s = s.replace(/[()]/g, "");
  s = s.replace(/[^\d.,-]/g, "");
  if (s.includes(",") && s.includes(".")) {
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (s.includes(",")) {
    const parts = s.split(",");
    if (parts[parts.length - 1].length === 3) s = s.replace(/,/g, "");
    else s = s.replace(",", ".");
  }
  const n = parseFloat(s) || 0;
  return negative ? -Math.abs(n) : n;
}

export function parseStatementCsv(csvText: string): ParsedRow[] {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const keys = result.meta.fields || [];
  const dateKey = findKey(keys, ["date", "ngay", "ngày", "transaction date"]);
  const descKey = findKey(keys, ["description", "mo ta", "mô tả", "noi dung", "nội dung", "narrative", "detail"]);
  const amountKey = findKey(keys, ["amount", "so tien", "số tiền", "gia tri", "giá trị", "value"]);
  const debitKey = findKey(keys, ["debit", "ghi no", "ghi nợ", "phat sinh no"]);
  const creditKey = findKey(keys, ["credit", "ghi co", "ghi có", "phat sinh co"]);

  const rows: ParsedRow[] = [];

  for (const row of result.data) {
    const dateRaw = dateKey ? row[dateKey] : "";
    const descRaw = descKey ? row[descKey] : Object.values(row).join(" ");
    if (!dateRaw && !descRaw) continue;

    let amount = 0;
    if (amountKey && row[amountKey]) {
      amount = parseAmount(row[amountKey]);
    } else if (debitKey || creditKey) {
      const debit = debitKey ? parseAmount(row[debitKey]) : 0;
      const credit = creditKey ? parseAmount(row[creditKey]) : 0;
      amount = credit - debit || (debit ? -Math.abs(debit) : credit);
      if (debit && !credit) amount = -Math.abs(debit);
      if (credit && !debit) amount = Math.abs(credit);
    }

    if (!dateRaw && !amount) continue;

    const description = (descRaw || "").trim();
    rows.push({
      date: parseDate(dateRaw || ""),
      description: description || "(không có mô tả)",
      amount,
      category: autoCategorize(description),
    });
  }

  return rows;
}
