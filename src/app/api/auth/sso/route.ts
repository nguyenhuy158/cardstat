import { NextResponse, type NextRequest } from "next/server";

import { ssoUrl } from "@/infrastructure/auth/session";

/**
 * Đăng nhập Google nằm ở SSO service — nơi giữ OAuth client duy nhất của cả
 * domain; app này chỉ verify cookie do nó phát ra.
 */
export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin;
  return NextResponse.redirect(await ssoUrl("/login", `${origin}/`), 302);
}
