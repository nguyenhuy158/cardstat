/**
 * Các route /api đều đòi session, nên CLI phải đăng nhập trước rồi mang cookie
 * theo. Thông tin đăng nhập lấy từ env CARDSTAT_USER / CARDSTAT_PASS.
 */

let cookieHeader = null;

async function signIn(baseUrl) {
  const username = process.env.CARDSTAT_USER;
  const password = process.env.CARDSTAT_PASS;
  if (!username || !password) {
    console.error("Thiếu CARDSTAT_USER / CARDSTAT_PASS. Ví dụ:");
    console.error("  CARDSTAT_USER=huy CARDSTAT_PASS=... pnpm tx");
    process.exit(1);
  }

  // Better Auth từ chối request không có Origin (chống CSRF), mà fetch trong
  // Node thì không tự gắn — phải khai báo tay và origin đó phải nằm trong
  // trustedOrigins của createAuth.
  const res = await fetch(new URL("/api/auth/sign-in/username", baseUrl), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: new URL(baseUrl).origin,
    },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = body.message || body.error || "";
    } catch {
      detail = await res.text();
    }
    console.error(`Đăng nhập thất bại (${res.status}): ${detail}`);
    process.exit(1);
  }

  const cookies = res.headers.getSetCookie();
  if (cookies.length === 0) {
    console.error("Đăng nhập xong nhưng server không trả cookie session.");
    process.exit(1);
  }
  return cookies.map((c) => c.split(";")[0]).join("; ");
}

/** fetch có kèm cookie session; lần gọi đầu tiên sẽ tự đăng nhập. */
export async function authFetch(baseUrl, url, init = {}) {
  cookieHeader ??= await signIn(baseUrl);
  return fetch(url, {
    ...init,
    headers: { ...init.headers, cookie: cookieHeader },
  });
}
