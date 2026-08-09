#!/usr/bin/env node
// Smoke test sau khi deploy: gọi vài endpoint quan trọng trên môi trường thật
// (hoặc localhost khi chạy tay) và kiểm tra vài điều kiện tối thiểu để chắc
// chắn bản deploy không "vô tình public" dữ liệu tài chính của người dùng.
//
// Dùng:
//   node scripts/smoke.mjs [baseUrl]
//   node scripts/smoke.mjs                     # mặc định https://cardstats.huyab.click
//   node scripts/smoke.mjs http://localhost:3000
//   SMOKE_BASE_URL=... node scripts/smoke.mjs
//
// Exit code 0 nếu mọi kiểm tra "cứng" (hard assertion) đều pass, 1 nếu có
// kiểm tra fail. Không dùng dependency ngoài — chỉ `fetch`/`crypto` built-in
// của Node.

import { createHash } from "node:crypto";

const baseUrl = (process.argv[2] || process.env.SMOKE_BASE_URL || "https://cardstats.huyab.click")
  .replace(/\/+$/, "");

// Marker tiếng Việt lấy nguyên văn từ src/app/login/page.tsx — nếu ai đổi câu
// này ở đó thì cũng phải sửa ở đây, cố ý làm vậy để test không "giả pass" bằng
// một chuỗi chung chung như "Đăng nhập".
const LOGIN_MARKER = "Đăng nhập bằng tài khoản huyab.click";

// Query param đổi mỗi lần gọi để tránh bất kỳ tầng cache nào (browser cache,
// Cloudflare edge cache nếu route nào đó lỡ bị đánh dấu cacheable) trả lại
// một response cũ thay vì gọi thật tới worker.
function cacheBustedUrl(path) {
  const url = new URL(path, baseUrl);
  url.searchParams.set("_cb", `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  return url;
}

async function get(path) {
  const url = cacheBustedUrl(path);
  // redirect: "manual" — không tự đi theo redirect, vì ta cần biết chính xác
  // status/headers của path đang test (ví dụ "/" redirect sang "/login" là
  // một kết quả hợp lệ, nhưng nếu fetch tự follow thì ta lại tưởng đang test
  // "/" mà thực ra đang đọc HTML của "/login").
  const res = await fetch(url, { redirect: "manual" });
  const text = await res.text().catch(() => "");
  return { status: res.status, headers: res.headers, text, url: url.toString() };
}

const results = [];

function record(name, pass, expected, actual, extra = "") {
  results.push({ name, pass, expected, actual, extra });
}

function printResult({ name, pass, expected, actual, extra }) {
  const label = pass ? "PASS" : "FAIL";
  console.log(`[${label}] ${name}`);
  if (!pass) {
    console.log(`       Mong đợi: ${expected}`);
    console.log(`       Thực tế:  ${actual}`);
    if (extra) console.log(`       ${extra}`);
  }
}

// --- 1. /login phải trả 200 và có nội dung tiếng Việt thật của trang login ---
const login = await get("/login");
record(
  "GET /login trả 200",
  login.status === 200,
  "200",
  String(login.status),
);
record(
  "GET /login chứa marker tiếng Việt của form đăng nhập",
  login.text.includes(LOGIN_MARKER),
  `HTML chứa "${LOGIN_MARKER}"`,
  login.text.includes(LOGIN_MARKER) ? "có" : "không tìm thấy chuỗi này trong HTML trả về",
);

// --- 2. /api/stats KHÔNG session phải trả 401 — đây là assertion quan trọng
// nhất trong cả bộ: nếu route này trả 200 khi chưa đăng nhập thì dữ liệu chi
// tiêu của TẤT CẢ người dùng đang bị public. ---
const stats = await get("/api/stats");
record(
  "GET /api/stats (không auth) trả 401",
  stats.status === 401,
  "401",
  String(stats.status),
  stats.status === 200
    ? "NGHIÊM TRỌNG: route trả 200 khi không có session — dữ liệu có thể đang bị lộ công khai."
    : "",
);

// --- 3. / (trang chủ) không có cookie SSO phải redirect sang /login. Từ khi
// dùng SSO thì `src/proxy.ts` chặn ngay ở tầng proxy nên đây là redirect thật,
// không còn trường hợp trả 200 kèm lớp guard render ở client như trước. ---
const root = await get("/");
const rootLocation = root.headers.get("location") || "";
const rootPass = root.status >= 300 && root.status < 400 && rootLocation.includes("/login");
record(
  'GET / (không auth) redirect sang "/login"',
  rootPass,
  'redirect 3xx tới "/login"',
  root.status >= 300 && root.status < 400
    ? `redirect ${root.status} tới "${rootLocation}"`
    : `status ${root.status}`,
  root.status === 200
    ? "NGHIÊM TRỌNG: trang chủ trả HTML khi không có cookie — kiểm tra src/proxy.ts."
    : "",
);

for (const r of results) printResult(r);

const hardPass = results.every((r) => r.pass);

// --- Thông tin thêm, KHÔNG dùng để pass/fail: dấu vân tay (fingerprint) của
// các asset tĩnh (_next/static/...) tham chiếu trong HTML /login. Hai lần
// deploy khác nhau (có thay đổi client bundle) sẽ có tên file khác nhau vì
// Next.js đặt tên asset theo content hash, nên fingerprint đổi nghĩa là chắc
// chắn đang đọc bản deploy mới, không phải bản cache/deploy cũ còn sống.
// In ra để workflow ở CI tự so sánh trước/sau, không assert ở đây vì trên
// localhost tên chunk khác hẳn production và một commit không đổi bundle
// (ví dụ chỉ sửa README) hợp lệ vẫn có fingerprint giữ nguyên.
const assetMatches = login.text.match(/_next\/static\/[^"')\s]+/g) || [];
const fingerprint = assetMatches.length
  ? createHash("sha256").update([...assetMatches].sort().join("\n")).digest("hex").slice(0, 16)
  : "";
console.log(`\nAsset fingerprint (chỉ để đối chiếu, không tính pass/fail): FINGERPRINT=${fingerprint || "none"}`);

// --- Thông tin thêm: cf-cache-status, nếu Cloudflare có gắn header này thì
// "HIT" nghĩa là response đến từ cache edge chứ không phải worker chạy thật.
// Local dev không có header này nên chỉ cảnh báo, không fail.
const cfCacheStatus = login.headers.get("cf-cache-status");
if (cfCacheStatus) {
  console.log(`cf-cache-status của /login: ${cfCacheStatus}${cfCacheStatus === "HIT" ? " (cảnh báo: có thể đang đọc cache edge)" : ""}`);
}

console.log(`\n${hardPass ? "Tất cả kiểm tra bắt buộc đều PASS." : "CÓ KIỂM TRA BẮT BUỘC FAIL."} (base URL: ${baseUrl})`);

process.exit(hardPass ? 0 : 1);
