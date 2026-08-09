"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { authClient } from "@/infrastructure/auth/auth-client";

import { BottomNav } from "../bottom-nav";
import { AppRouteSkeleton, SkeletonBlock, UsernameSkeleton } from "../skeleton";
import { DesktopNav } from "./desktop-nav";

/**
 * Layout dùng chung cho các trang đã đăng nhập (Tổng quan, Nhập, Biểu đồ,
 * Giao dịch). Gộp phần "khung" (guard đăng nhập, header sticky, điều hướng)
 * vào một chỗ để không phải lặp lại ở từng trang — trước đây bốn trang này
 * là một trang duy nhất nên guard chỉ chạy một lần, giờ tách trang vẫn giữ
 * nguyên tính chất đó nhờ đặt ở layout.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const signedIn = Boolean(session?.user);

  // Chưa đăng nhập thì mọi route /api đều trả 401 — đẩy thẳng sang /login.
  useEffect(() => {
    if (!sessionPending && !signedIn) router.replace("/login");
  }, [sessionPending, signedIn, router]);

  async function handleSignOut() {
    await authClient.signOut();
    router.replace("/login");
  }

  // Đã biết chắc chưa đăng nhập (không còn "đang chờ") thì effect trên đang
  // điều hướng sang /login ngay — đây là màn hình chuyển tiếp cực ngắn, không
  // phải trạng thái chờ dữ liệu, nên giữ dòng chữ đơn giản, không cần khung
  // trang thật (tránh nhấp nháy hiện đủ header/nav của trang đã đăng nhập).
  if (!sessionPending && !signedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
        Đang chuyển sang trang đăng nhập...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Thanh header sticky gọn cho mobile: tiêu đề bên trái, người dùng + đăng xuất bên phải.
          Trên sm+ có thêm nav ngang vì bottom-nav bị ẩn ở desktop.
          Tiêu đề và nav giữ nguyên kể cả lúc `sessionPending` (không phụ thuộc
          session); tên người dùng và nút đăng xuất thì thành skeleton vì cả hai
          chỉ đúng khi đã đăng nhập. */}
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-zinc-50/95 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="mx-auto flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:max-w-5xl">
          <div className="flex min-w-0 items-center gap-6">
            <h1 className="min-w-0 truncate text-base font-bold sm:text-xl">
              Thống kê chi tiêu thẻ tín dụng
            </h1>
            <DesktopNav />
          </div>
          <div className="flex min-w-0 shrink-0 items-center gap-2 text-sm">
            {sessionPending ? (
              <>
                <UsernameSkeleton />
                {/* Nút "Đăng xuất" cũng phải là skeleton: chưa biết có đăng nhập
                    hay không mà đã bày nút của trạng thái đã đăng nhập thì khách
                    chưa đăng nhập sẽ thấy nhoáng một giao diện sai rồi mới bị
                    đẩy sang /login. Cùng h-11 + w để không nhảy layout khi đổi. */}
                <SkeletonBlock className="h-11 w-[5.5rem] rounded-lg" />
              </>
            ) : (
              <>
                <span className="max-w-[6rem] truncate text-zinc-500 sm:max-w-[10rem] dark:text-zinc-400">
                  {session?.user.displayUsername || session?.user.name}
                </span>
                <button
                  onClick={handleSignOut}
                  className="flex h-11 items-center rounded-lg border border-zinc-200 px-3 font-medium transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Đăng xuất
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* pb lớn hơn trên mobile để bottom-nav không che nội dung/hàng cuối bảng */}
      <div className="mx-auto px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-8 lg:max-w-5xl">
        {sessionPending ? <AppRouteSkeleton pathname={pathname} /> : children}
      </div>

      <BottomNav />
    </div>
  );
}
