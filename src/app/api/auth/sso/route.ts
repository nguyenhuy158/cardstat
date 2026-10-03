import { ssoUrl } from "@huyab/sso";
import { NextResponse, type NextRequest } from "next/server";

import { ssoIssuer } from "@/infrastructure/auth/session";

/**
 * Đăng nhập Google nằm ở SSO service — nơi giữ OAuth client duy nhất của cả
 * domain; app này chỉ verify cookie do nó phát ra.
 */
export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin;
  return NextResponse.redirect(ssoUrl(await ssoIssuer(), "/login", `${origin}/`), 302);
}
