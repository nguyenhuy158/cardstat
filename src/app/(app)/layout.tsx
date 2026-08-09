import { redirect } from "next/navigation";

import { getSessionClaims } from "@/infrastructure/auth/session";

import { BottomNav } from "../bottom-nav";
import { DesktopNav } from "./desktop-nav";

/**
 * Layout dùng chung cho các trang đã đăng nhập (Tổng quan, Nhập, Biểu đồ,
 * Giao dịch). Gộp phần "khung" (guard đăng nhập, header sticky, điều hướng) vào
 * một chỗ để không phải lặp lại ở từng trang, và để không thêm được trang mới
 * mà quên guard.
 *
 * Guard chạy trên server: cookie SSO đã có sẵn ngay từ request đầu tiên nên
 * không còn trạng thái "đang kiểm tra session" như thời better-auth (client phải
 * gọi /api/auth/get-session mới biết) — chưa đăng nhập thì redirect thẳng, tên
 * người dùng render luôn ở lần vẽ đầu, không cần skeleton.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const claims = await getSessionClaims();
  if (!claims) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Thanh header sticky gọn cho mobile: tiêu đề bên trái, người dùng + đăng
          xuất bên phải. Trên sm+ có thêm nav ngang vì bottom-nav bị ẩn ở desktop. */}
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-zinc-50/95 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="mx-auto flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:max-w-5xl">
          <div className="flex min-w-0 items-center gap-6">
            <h1 className="min-w-0 truncate text-base font-bold sm:text-xl">
              Thống kê chi tiêu thẻ tín dụng
            </h1>
            <DesktopNav />
          </div>
          <div className="flex min-w-0 shrink-0 items-center gap-2 text-sm">
            <span className="max-w-[6rem] truncate text-zinc-500 sm:max-w-[10rem] dark:text-zinc-400">
              {claims.name || claims.email}
            </span>
            {/* Thẻ <a> chứ không phải <button>: đăng xuất là điều hướng sang SSO
                (chỉ nó xoá được cookie của cả domain), không phải gọi API. */}
            <a
              href="/api/auth/logout"
              className="flex h-11 items-center rounded-lg border border-zinc-200 px-3 font-medium transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Đăng xuất
            </a>
          </div>
        </div>
      </header>

      {/* pb lớn hơn trên mobile để bottom-nav không che nội dung/hàng cuối bảng */}
      <div className="mx-auto px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-8 lg:max-w-5xl">{children}</div>

      <BottomNav />
    </div>
  );
}
