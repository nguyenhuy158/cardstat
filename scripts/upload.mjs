#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { authFetch } from "./cli-auth.mjs";
import { resolveBaseUrl } from "./cli-url.mjs";

const [, , filePath, ...rest] = process.argv;

if (!filePath) {
  console.error("Usage: pnpm upload <file.pdf> [--url http://localhost:3000]");
  process.exit(1);
}

const baseUrl = resolveBaseUrl(rest);

let buffer;
try {
  buffer = await readFile(filePath);
} catch (err) {
  console.error(`Không đọc được file "${filePath}": ${err.code === "ENOENT" ? "không tồn tại" : err.message}`);
  process.exit(1);
}

const form = new FormData();
form.append("file", new Blob([buffer], { type: "application/pdf" }), basename(filePath));

const res = await authFetch(baseUrl, new URL("/api/upload", baseUrl), {
  method: "POST",
  body: form,
});

const body = await res.json();

if (!res.ok) {
  console.error(`Lỗi (${res.status}):`, body.error || body);
  process.exit(1);
}

console.log(`Đã nhập ${body.inserted} giao dịch từ ${basename(filePath)}`);
