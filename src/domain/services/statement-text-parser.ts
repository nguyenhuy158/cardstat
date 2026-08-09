import { autoCategorize } from "./categorize";
import type { NewTransaction } from "../entities/transaction";

const DATE_TOKEN = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/;

/**
 * Matches a bank/credit-card statement transaction line:
 *   <txn date> [<posting date>] <description...> <amount> [CR|DR]
 * The posting date, description, and CR/DR suffix are optional so it also
 * matches simpler single-date statement formats.
 */
const LINE_RE =
  /^(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s+(?:(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s+)?(.+?)\s+([\d.,]+)\s*(CR|DR|cr|dr)?$/;

function normalizeDate(raw: string): string {
  const m = raw.match(DATE_TOKEN);
  if (!m) return raw;
  let [, d, mo, y] = m;
  if (y.length === 2) y = "20" + y;
  return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function parseAmount(raw: string): number {
  let s = raw.trim();
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
  } else if (s.includes(".")) {
    const parts = s.split(".");
    if (parts[parts.length - 1].length === 3 && parts.length > 1) s = s.replace(/\./g, "");
  }
  return parseFloat(s) || 0;
}

/**
 * Heuristic line-based parser for text extracted from a bank/credit-card
 * statement PDF. A "CR" suffix marks a payment/credit (positive amount);
 * everything else is treated as a purchase/debit (negative amount), which
 * matches how a credit card statement works.
 */
export function parseStatementText(text: string): NewTransaction[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const rows: NewTransaction[] = [];

  for (const line of lines) {
    const match = line.match(LINE_RE);
    if (!match) continue;

    const [, dateRaw, , descriptionRaw, amountRaw, marker] = match;
    const magnitude = parseAmount(amountRaw);
    if (magnitude === 0) continue;

    const isCredit = /^cr$/i.test(marker || "");
    const amount = isCredit ? Math.abs(magnitude) : -Math.abs(magnitude);

    const description = descriptionRaw.trim();
    if (!description || !/\p{L}/u.test(description)) continue;

    rows.push({
      date: normalizeDate(dateRaw),
      description,
      amount,
      category: autoCategorize(description),
    });
  }

  return rows;
}
