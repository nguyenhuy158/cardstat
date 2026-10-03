// Chay ca bo E2E dev mot lenh: OpenNext build -> ap migration D1 local -> bat
// SSO gia -> bat worker that bang `wrangler dev` (giong `pnpm preview`) -> chay
// smoke suite -> tat het.
//
// SSO that (auth.huyab.click) khong dung duoc trong test, nen dung
// `startSsoMock` cua @huyab/e2e (JWKS + token ky bang khoa sinh luc chay);
// worker duoc bat voi SSO_ISSUER tro ve day nen cookie `huyab_sso` hop le.
//
// Bien moi truong:
// - E2E_PORT: cong cho wrangler dev (mac dinh: mot cong trong)
// - E2E_SKIP_BUILD=1: bo qua OpenNext build (dung khi ./.open-next da moi)
// - PLAYWRIGHT_CHROMIUM_PATH: chi dinh Chromium cu the
import { freePort, run, startServer, startSsoMock } from "@huyab/e2e";

const PORT = process.env.E2E_PORT || (await freePort());
const BASE = `http://127.0.0.1:${PORT}`;
const E2E_EMAIL = "e2e@cardstat.local";

const sso = await startSsoMock();

if (process.env.E2E_SKIP_BUILD !== "1") {
  await run("pnpm", ["exec", "opennextjs-cloudflare", "build"], { label: "OpenNext build" });
}
await run("pnpm", ["exec", "wrangler", "d1", "migrations", "apply", "db", "--local"], {
  label: "migration D1",
});
// Xoa du lieu cua user E2E tu lan chay truoc de so lieu co dinh.
await run(
  "pnpm",
  [
    "exec", "wrangler", "d1", "execute", "db", "--local", "--command",
    ["cardstat_transactions", "cardstat_uploads", "cardstat_budgets"]
      .map((table) => `DELETE FROM ${table} WHERE user_id IN (SELECT id FROM user WHERE email = '${E2E_EMAIL}')`)
      .join("; "),
  ],
  { label: "reset D1 E2E data" },
);

const server = await startServer({
  command: "pnpm",
  args: ["exec", "wrangler", "dev", "--ip", "127.0.0.1", "--port", PORT, "--var", `SSO_ISSUER:${sso.issuer}`],
  readyUrl: `${BASE}/login`,
});

let failed = false;
try {
  console.log(`\nServer san sang tai ${BASE}, bat dau smoke suite\n`);
  await run("node", ["e2e/ui-smoke.mjs"], {
    label: "smoke suite",
    env: { E2E_BASE_URL: BASE, E2E_SSO_TOKEN: sso.mintToken(E2E_EMAIL, "E2E User") },
  });
} catch (error) {
  failed = true;
  console.error("E2E FAIL:", error.message);
} finally {
  await server.stop();
  sso.close();
}

process.exit(failed ? 1 : 0);
