import { ssoUrl } from "@huyab/sso";
import { NextResponse, type NextRequest } from "next/server";

import { ssoIssuer } from "@/infrastructure/auth/session";

/**
 * Cookie SSO thuộc cả domain nên chỉ SSO service xoá được; app này không còn
 * session riêng nào để dọn.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const origin = url.hostname === "cardstats.huyab.cfd" ? "https://dash.huyab.cfd" : url.origin;
  return NextResponse.redirect(ssoUrl(await ssoIssuer(), "/logout", `${origin}/spending/login`), 302);
}
