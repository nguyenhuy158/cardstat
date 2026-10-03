// Chay ca bo E2E dev mot lenh: OpenNext build -> ap migration D1 local -> bat
// SSO gia -> bat worker that bang `wrangler dev` (giong `pnpm preview`) -> chay
// smoke suite -> tat het.
//
// SSO that (auth.huyab.click) khong dung duoc trong test, nen script tu sinh
// cap khoa RS256 va phuc vu JWKS o GET /.well-known/jwks.json; worker duoc bat
// voi SSO_ISSUER tro ve day nen cookie `huyab_sso` ky boi khoa nay hop le.
//
// Bien moi truong:
// - E2E_PORT: cong cho wrangler dev (mac dinh 8817)
// - E2E_FAKE_PORT: cong cho SSO gia (mac dinh 8818)
// - E2E_SKIP_BUILD=1: bo qua OpenNext build (dung khi ./.open-next da moi)
// - PLAYWRIGHT_CHROMIUM_PATH: chi dinh Chromium cu the
import { spawn } from "node:child_process";
import { createSign, generateKeyPairSync } from "node:crypto";
import { createServer } from "node:http";

const PORT = process.env.E2E_PORT || "8817";
const FAKE_PORT = Number(process.env.E2E_FAKE_PORT || "8818");
const BASE = `http://127.0.0.1:${PORT}`;
const FAKE_ORIGIN = `http://127.0.0.1:${FAKE_PORT}`;
const E2E_EMAIL = "e2e@cardstat.local";
const KEY_ID = "e2e";
const SERVER_TIMEOUT_MS = 120_000;
const POLL_INTERVAL_MS = 500;

/** Chay mot lenh den khi ket thuc; loi thi nem. */
function run(command, args, label, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", env });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${label} that bai (exit ${code})`)),
    );
  });
}

/** Doi tan worker tra loi /login, hoac nem khi qua han. */
async function waitForServer(child) {
  const deadline = Date.now() + SERVER_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`wrangler dev tat som (exit ${child.exitCode})`);
    try {
      const response = await fetch(BASE + "/login");
      if (response.ok) return;
    } catch {
      // Server chua san sang, thu lai.
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  throw new Error(`wrangler dev khong len sau ${SERVER_TIMEOUT_MS}ms`);
}

const base64Url = (value) => Buffer.from(value).toString("base64url");

const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: "jwk" }), kid: KEY_ID, alg: "RS256", use: "sig" };
const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT", kid: KEY_ID }));
const payload = base64Url(
  JSON.stringify({
    iss: FAKE_ORIGIN,
    sub: "e2e-user",
    email: E2E_EMAIL,
    name: "E2E User",
    exp: Math.floor(Date.now() / 1000) + 3600,
  }),
);
const signature = createSign("RSA-SHA256").update(`${header}.${payload}`).sign(privateKey, "base64url");
const token = `${header}.${payload}.${signature}`;

const fake = createServer((req, res) => {
  if (req.method === "GET" && req.url === "/.well-known/jwks.json") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ keys: [jwk] }));
  }
  res.writeHead(404).end();
});
await new Promise((resolve) => fake.listen(FAKE_PORT, "127.0.0.1", resolve));

if (process.env.E2E_SKIP_BUILD !== "1") {
  await run("pnpm", ["exec", "opennextjs-cloudflare", "build"], "OpenNext build");
}
await run("pnpm", ["exec", "wrangler", "d1", "migrations", "apply", "db", "--local"], "migration D1");
// Xoa du lieu cua user E2E tu lan chay truoc de so lieu co dinh.
await run(
  "pnpm",
  [
    "exec", "wrangler", "d1", "execute", "db", "--local", "--command",
    ["cardstat_transactions", "cardstat_uploads", "cardstat_budgets"]
      .map((table) => `DELETE FROM ${table} WHERE user_id IN (SELECT id FROM user WHERE email = '${E2E_EMAIL}')`)
      .join("; "),
  ],
  "reset D1 E2E data",
);

// `detached` cho server mot process group rieng: `pnpm exec` sinh them tang
// node con, kill rieng PID cha se bo mo coi wrangler/workerd giu cong.
const server = spawn(
  "pnpm",
  [
    "exec", "wrangler", "dev",
    "--ip", "127.0.0.1",
    "--port", PORT,
    "--var", `SSO_ISSUER:${FAKE_ORIGIN}`,
  ],
  { stdio: ["ignore", "inherit", "inherit"], env: { ...process.env, CI: "1" }, detached: true },
);

/** Gui signal toi ca process group cua server (bo qua neu da tat). */
function killServer(signal) {
  try {
    process.kill(-server.pid, signal);
  } catch {
    // Group da tat.
  }
}

// Group tach rieng nen Ctrl-C khong toi server: tu don truoc khi thoat.
process.once("SIGINT", () => {
  killServer("SIGKILL");
  process.exit(130);
});

let failed = false;
try {
  await waitForServer(server);
  console.log(`\nServer san sang tai ${BASE}, bat dau smoke suite\n`);
  await run("node", ["e2e/ui-smoke.mjs"], "smoke suite", {
    ...process.env,
    E2E_BASE_URL: BASE,
    E2E_SSO_TOKEN: token,
  });
} catch (error) {
  failed = true;
  console.error("E2E FAIL:", error.message);
} finally {
  const exited = new Promise((resolve) => server.once("exit", () => resolve(true)));
  killServer("SIGTERM");
  // Cho wrangler don dep; qua han thi ket lieu de process khong treo.
  const stopped = server.exitCode !== null || (await Promise.race([
    exited,
    new Promise((resolve) => setTimeout(() => resolve(false), 5000)),
  ]));
  // Ket lieu ca group: wrangler co the tat truoc khi workerd con kip don.
  killServer("SIGKILL");
  if (!stopped) console.error("wrangler khong tat sau SIGTERM, da SIGKILL");
  fake.close();
}

process.exit(failed ? 1 : 0);
