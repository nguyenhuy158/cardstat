#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { basename } from "node:path";

const [, , filePath, ...rest] = process.argv;

if (!filePath) {
  console.error("Usage: pnpm upload <file.pdf> [--url http://localhost:3000]");
  process.exit(1);
}

const urlFlagIndex = rest.indexOf("--url");
const baseUrl = urlFlagIndex !== -1 ? rest[urlFlagIndex + 1] : process.env.UPLOAD_URL || "http://localhost:3000";

let buffer;
try {
  buffer = await readFile(filePath);
} catch (err) {
  console.error(`Không đọc được file "${filePath}": ${err.code === "ENOENT" ? "không tồn tại" : err.message}`);
  process.exit(1);
}

const form = new FormData();
form.append("file", new Blob([buffer], { type: "application/pdf" }), basename(filePath));

const res = await fetch(new URL("/api/upload", baseUrl), {
  method: "POST",
  body: form,
});

const body = await res.json();

if (!res.ok) {
  console.error(`Lỗi (${res.status}):`, body.error || body);
  process.exit(1);
}

console.log(`Đã nhập ${body.inserted} giao dịch từ ${basename(filePath)}`);
