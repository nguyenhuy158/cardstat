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
  console.log(`${t.id.toString().padStart(5)}  ${t.date}  ${amount.padStart(18)}  ${t.category.padEnd(14)} ${t.description}`);
}
console.log(`\n${body.length} giao dịch.`);
