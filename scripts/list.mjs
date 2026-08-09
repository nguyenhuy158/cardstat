#!/usr/bin/env node
import { authFetch } from "./cli-auth.mjs";
import { resolveBaseUrl } from "./cli-url.mjs";

const args = process.argv.slice(2);
const baseUrl = resolveBaseUrl(args);

function flagValue(name) {
  const i = args.indexOf(name);
  return i !== -1 ? args[i + 1] : undefined;
}

function vnd(n) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);
}

// Giống `formatDate` ở src/app/format.ts, chép lại thủ công vì script này chạy
// bằng node thuần (không qua build Next), không import trực tiếp file .ts được.
function formatDate(date) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date ?? "");
  if (!m) return date;
  const [, y, mo, d] = m;
  return `${d}/${mo}/${y}`;
}

const month = flagValue("--month");
const category = flagValue("--category");

const url = new URL("/api/transactions", baseUrl);
if (month) url.searchParams.set("month", month);
if (category) url.searchParams.set("category", category);

const res = await authFetch(baseUrl, url);
const body = await res.json();

if (!res.ok) {
  console.error(`Lỗi (${res.status}):`, body.error || body);
  process.exit(1);
}

if (body.length === 0) {
  console.log("Không có giao dịch nào.");
  process.exit(0);
}

for (const t of body) {
  const amount = t.amount >= 0 ? `+${vnd(t.amount)}` : vnd(t.amount);
  console.log(`${t.id.toString().padStart(5)}  ${formatDate(t.date)}  ${amount.padStart(18)}  ${t.category.padEnd(14)} ${t.description}`);
}
console.log(`\n${body.length} giao dịch.`);
