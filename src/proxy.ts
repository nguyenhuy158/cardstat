import { NextResponse, type NextRequest } from "next/server";

const SSO_COOKIE = "huyab_sso";

/**
 * Chỉ kiểm tra cookie CÓ TỒN TẠI, không verify chữ ký: tài liệu Next.js khuyên
 * không xử lý session ở proxy, và fetch JWKS ở đây thì mỗi request tốn thêm một
 * round-trip.
 *
 * Kiểm tra thật nằm ở `getSessionClaims()` / `requireUser()` — được layout đã
 * đăng nhập và mọi route handler gọi. Lớp này chỉ để trình duyệt chưa đăng nhập
 * rơi vào /login thay vì thấy trang trống.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(SSO_COOKIE)) return NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  // Trừ trang login, hai route bắt tay SSO, và asset tĩnh.
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
