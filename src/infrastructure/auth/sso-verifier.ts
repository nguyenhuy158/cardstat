/**
 * Xác thực cookie SSO dùng chung cho cả domain, do auth.huyab.click phát hành.
 *
 * Token là JWT RS256 do SSO ký; app này chỉ giữ khoá công khai lấy từ JWKS của
 * issuer nên không thể tự phát token cho mình hay cho app khác.
 */

export type SsoClaims = {
  iss: string;
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  exp: number;
};

/** Cache theo isolate: fetch JWKS mỗi request sẽ thêm một round-trip vô ích. */
const keyCache = new Map<string, Promise<CryptoKey>>();

function publicKey(issuer: string, kid: string): Promise<CryptoKey> {
  const cacheKey = `${issuer}#${kid}`;
  const cached = keyCache.get(cacheKey);
  if (cached) return cached;

  const pending = (async () => {
    const response = await fetch(`${issuer}/.well-known/jwks.json`);
    if (!response.ok) throw new Error(`JWKS fetch failed: ${response.status}`);

    const { keys } = (await response.json()) as { keys: Array<Record<string, unknown>> };
    const jwk = keys?.find((key) => key.kid === kid) ?? keys?.[0];
    if (!jwk) throw new Error("JWKS không có khoá dùng được");

    return crypto.subtle.importKey(
      "jwk",
      { ...jwk, ext: true } as JsonWebKey,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
  })();

  keyCache.set(cacheKey, pending);
  // Fetch lỗi thì không được để cache hỏng suốt đời isolate.
  pending.catch(() => keyCache.delete(cacheKey));
  return pending;
}

function base64UrlDecode(value: string): Uint8Array<ArrayBuffer> {
  const padded = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Trả về claims khi token hợp lệ và `null` cho MỌI trường hợp còn lại (sai định
 * dạng, sai chữ ký, sai issuer, hết hạn, không lấy được JWKS). Người gọi coi
 * `null` là "chưa đăng nhập" — không có mức tin cậy trung gian.
 */
export async function verifySsoToken(token: string, issuer: string): Promise<SsoClaims | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const header = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[0]))) as {
      kid?: string;
    };

    const valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      await publicKey(issuer, header.kid ?? ""),
      base64UrlDecode(parts[2]),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
    );
    if (!valid) return null;

    const claims = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[1]))) as SsoClaims;
    if (claims.iss !== issuer) return null;
    if (!claims.exp || claims.exp <= Math.floor(Date.now() / 1000)) return null;
    if (!claims.sub || !claims.email) return null;

    return claims;
  } catch {
    return null;
  }
}
