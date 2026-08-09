#!/usr/bin/env node
import { resolveBaseUrl } from "./cli-url.mjs";

const baseUrl = resolveBaseUrl(process.argv.slice(2));

function vnd(n) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);
}

const res = await fetch(new URL("/api/stats", baseUrl));
const body = await res.json();

if (!res.ok) {
  console.error(`Lỗi (${res.status}):`, body.error || body);
  process.exit(1);
}

console.log(`Tổng chi tiêu:      ${vnd(body.totals.totalSpend)}`);
console.log(`Tổng thu/hoàn tiền: ${vnd(body.totals.totalIncome)}`);
console.log(`Số giao dịch:       ${body.totals.count || 0}`);

if (body.byCategory.length) {
  console.log("\nTheo danh mục:");
  for (const c of body.byCategory) {
    if (c.total > 0) console.log(`  ${c.category.padEnd(20)} ${vnd(c.total)}`);
  }
}

if (body.byMonth.length) {
  console.log("\nTheo tháng:");
  for (const m of body.byMonth) {
    console.log(`  ${m.month}  chi: ${vnd(m.spend).padStart(15)}  thu: ${vnd(m.income)}`);
  }
}
