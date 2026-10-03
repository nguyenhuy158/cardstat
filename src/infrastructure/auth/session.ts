import { DEFAULT_SSO_ISSUER, SSO_COOKIE, type SsoClaims, verifySsoToken } from "@huyab/sso";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cookies } from "next/headers";

const SSO_COOKIE_PATTERN = new RegExp(`(?:^|;\\s*)${SSO_COOKIE}=([^;]+)`);

/**
 * Issuer đọc từ biến `SSO_ISSUER` trong wrangler.jsonc. Không nằm trong
 * CloudflareEnv do `wrangler types` sinh ra khi chạy `next dev` thuần Node, nên
 * lấy qua process.env trước rồi mới tới binding.
 */
export async function ssoIssuer(): Promise<string> {
  if (process.env.SSO_ISSUER) return process.env.SSO_ISSUER;
  try {
    const { env } = await getCloudflareContext({ async: true });
    return (env as CloudflareEnv & { SSO_ISSUER?: string }).SSO_ISSUER || DEFAULT_SSO_ISSUER;
  } catch {
    return DEFAULT_SSO_ISSUER;
  }
}

/** Claims của người đang đăng nhập, hoặc `null`. Đọc cookie qua `next/headers`. */
export async function getSessionClaims(): Promise<SsoClaims | null> {
  const token = (await cookies()).get(SSO_COOKIE)?.value;
  if (!token) return null;
  return verifySsoToken(token, await ssoIssuer());
}

/**
 * Như trên nhưng đọc cookie từ `Request` — dùng trong route handler. Chỉ nhận
 * cookie, không nhận `Authorization: Bearer` như `getClaimsFromRequest` của
 * @huyab/sso.
 */
export async function getClaimsFromRequest(req: Request): Promise<SsoClaims | null> {
  const token = req.headers.get("Cookie")?.match(SSO_COOKIE_PATTERN)?.[1];
  if (!token) return null;
  return verifySsoToken(token, await ssoIssuer());
}

/**
 * Đổi claims SSO thành một dòng trong bảng `user` của app.
 *
 * Giao dịch khoá theo `user_id` nên vẫn cần một id ổn định của riêng app; đối
 * chiếu theo EMAIL vì đó là thứ SSO đảm bảo duy nhất và Google đã xác minh.
 * `sub` không dùng làm khoá để nếu SSO có đổi cách sinh sub thì dữ liệu cũ
 * không bị mồ côi.
 */
export async function resolveUserId(db: D1Database, claims: SsoClaims): Promise<string> {
  const existing = await db
    .prepare("SELECT id FROM user WHERE email = ?")
    .bind(claims.email)
    .first<{ id: string }>();
  if (existing) return existing.id;

  const id = crypto.randomUUID();
  const now = Date.now();
  await db
    .prepare(
      `INSERT INTO user (id, name, email, email_verified, image, created_at, updated_at)
       VALUES (?, ?, ?, 1, ?, ?, ?)
       ON CONFLICT (email) DO NOTHING`,
    )
    .bind(id, claims.name || claims.email, claims.email, claims.picture ?? null, now, now)
    .run();

  // Hai request đầu tiên của cùng một người có thể chạy song song; ai thua thì
  // đọc lại dòng của người thắng thay vì tạo user thứ hai.
  const row = await db
    .prepare("SELECT id FROM user WHERE email = ?")
    .bind(claims.email)
    .first<{ id: string }>();
  if (!row) throw new Error("Không tạo được user cho phiên SSO");
  return row.id;
}
