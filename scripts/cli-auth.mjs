/**
 * Các route /api đều đòi cookie SSO `huyab_sso` của auth.huyab.click. CLI không
 * tự đăng nhập được (SSO là luồng OAuth trên trình duyệt), nên phải mang sẵn
 * cookie: mở app trên trình duyệt, copy giá trị cookie `huyab_sso` trong
 * devtools rồi đặt vào env HUYAB_SSO_COOKIE.
 */

const COOKIE_NAME = "huyab_sso";

function cookieHeader() {
  const token = process.env.HUYAB_SSO_COOKIE;
  if (!token) {
    console.error(`Thiếu HUYAB_SSO_COOKIE. Lấy giá trị cookie "${COOKIE_NAME}" trong devtools rồi:`);
    console.error("  HUYAB_SSO_COOKIE=... pnpm tx");
    process.exit(1);
  }
  return `${COOKIE_NAME}=${token}`;
}

/** fetch có kèm cookie SSO. Báo lỗi rõ khi cookie thiếu hoặc đã hết hạn. */
export async function authFetch(baseUrl, url, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: { ...init.headers, cookie: cookieHeader() },
  });

  if (res.status === 401) {
    console.error("Cookie SSO không hợp lệ hoặc đã hết hạn — lấy lại giá trị mới từ devtools.");
    process.exit(1);
  }

  return res;
}
