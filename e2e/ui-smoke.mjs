// E2E smoke test cho cardstat bang Chromium (playwright-core).
//
// Hai phan:
// 1. Chua dang nhap - CHI DOC (chay ca tren prod): GET /, /login,
//    /api/stats, /manifest.webmanifest; kiem tra redirect ve /login, trang
//    login render va API tu choi request khong co cookie.
// 2. Da dang nhap - chi chay khi co E2E_SSO_TOKEN (do e2e/run.mjs cap) va
//    E2E_BASE_URL la localhost: tao giao dich qua API vao D1 local, kiem tra
//    Tong quan, tim + xoa o trang Giao dich, trang Bieu do.
//
// `pnpm e2e` = OpenNext build + wrangler dev local + ca 2 phan.
// `pnpm e2e:prod` = chi phan 1 tren https://cardstats.huyab.click.
//
// Bien moi truong:
// - E2E_BASE_URL: mac dinh http://127.0.0.1:8787 (BASE cua @huyab/e2e)
// - E2E_SSO_TOKEN: do e2e/run.mjs truyen vao
// - PLAYWRIGHT_CHROMIUM_PATH: xem findChromium cua @huyab/e2e
import { assert, assertLocalOnly, BASE, findChromium } from "@huyab/e2e";
import { chromium } from "playwright-core";

const SSO_TOKEN = process.env.E2E_SSO_TOKEN;
const WAIT = { timeout: 20000 };
// Nguyen van tu src/app/login/page.tsx (giong scripts/smoke.mjs).
const LOGIN_MARKER = "Đăng nhập bằng tài khoản huyab.click";

// Phan 2 ghi D1: token chi duoc dung voi server local, e2e:prod phai chi doc.
if (SSO_TOKEN) assertLocalOnly();

let passed = 0;
let failed = 0;

function ok(name) {
  passed += 1;
  console.log(`PASS ${name}`);
}

const browser = await chromium.launch({ executablePath: findChromium() });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
const pageErrors = [];
page.on("pageerror", (error) => {
  pageErrors.push(error.message);
  console.log("PAGE ERROR:", error.message);
});

try {
  // ---- Phan 1: chi doc, an toan cho prod ----
  await page.goto(BASE + "/");
  await page.waitForURL("**/login", WAIT);
  await page.getByText(LOGIN_MARKER).waitFor(WAIT);
  await page.getByRole("link", { name: "Tiếp tục với Google" }).waitFor(WAIT);
  ok("logged-out / redirects to the SSO login page");

  const stats = await page.request.get(BASE + "/api/stats");
  assert(stats.status() === 401, `/api/stats phai 401, got ${stats.status()}`);
  const transactions = await page.request.get(BASE + "/api/transactions");
  assert(transactions.status() === 401, `/api/transactions phai 401, got ${transactions.status()}`);
  ok("API rejects anonymous requests");

  const manifest = await page.request.get(BASE + "/manifest.webmanifest");
  assert(manifest.ok(), `GET /manifest.webmanifest tra ${manifest.status()}`);
  assert((await manifest.json()).short_name === "Cardstat", "manifest phai co short_name Cardstat");
  ok("web manifest is served");

  // ---- Phan 2: chi local, co ghi D1 local ----
  if (SSO_TOKEN) {
    const description = `E2E Coffee ${Date.now()}`;
    const today = new Date().toISOString().slice(0, 10);
    await context.addCookies([{ name: "huyab_sso", value: SSO_TOKEN, url: BASE }]);
    await page.goto(BASE + "/");
    await page.waitForURL(BASE + "/", WAIT);

    const created = await page.evaluate(
      (body) =>
        fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }).then((response) => response.status),
      { date: today, description, amount: -123456, category: "Ăn uống" },
    );
    assert(created === 200, `tao giao dich phai 200, got ${created}`);
    ok("SSO cookie logs in and API accepts writes");

    await page.reload();
    const recentItem = page.locator("li", { hasText: description });
    await recentItem.waitFor(WAIT);
    await recentItem.getByText(/-123\.456\s₫/).waitFor(WAIT);
    ok("overview lists the transaction with VND formatting");

    await page.goto(BASE + "/charts");
    await page.getByText("Ngân sách theo danh mục").waitFor(WAIT);
    ok("charts page renders with data");

    await page.goto(BASE + "/transactions");
    await page.getByPlaceholder("Tìm mô tả, danh mục, số tiền...").fill(description);
    const row = page.locator("tr", { hasText: description });
    await row.waitFor(WAIT);
    await row.getByRole("button", { name: "Xóa", exact: true }).click();
    await row.waitFor({ state: "detached", ...WAIT });
    const remaining = await page.evaluate(() => fetch("/api/transactions").then((response) => response.json()));
    assert(
      !remaining.some((transaction) => transaction.description === description),
      "giao dich da xoa van con trong /api/transactions",
    );
    ok("transactions page searches and deletes");

  }

  assert(pageErrors.length === 0, `co ${pageErrors.length} loi JS tren trang`);
  ok("no uncaught page errors");
} catch (error) {
  failed += 1;
  console.log("FAIL:", error.message);
  await page.screenshot({ path: "e2e-failure.png" }).catch(() => {});
} finally {
  await browser.close();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
