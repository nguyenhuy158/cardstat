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
 *
 * Bố cục tách hẳn theo breakpoint thay vì header dùng chung: dưới `sm` là
 * header sticky + bottom-nav (không đủ chỗ ngang cho sidebar); từ `sm` trở
 * lên là sidebar cố định bên trái (`DesktopNav`, xem file đó để biết lý do
 * đổi từ nav ngang nhét trong header). Header cũ nhét cả tiêu đề dài, 4 link
 * nav, tên người dùng và nút đăng xuất vào một hàng nên ở độ rộng vừa (laptop
 * nhỏ, cửa sổ chia đôi) rất dễ bấm nhầm hoặc bị vỡ dòng.
 *
 * Toàn bộ khung khoá cứng theo chiều cao màn hình (`h-dvh`, không `min-h-screen`)
 * và tự cuộn ở vùng nội dung (`overflow-y-auto`) thay vì cuộn cả trang — sidebar
 * và header nhờ vậy đứng yên tuyệt đối, không cần `sticky` chống trôi nữa. Trang
 * nào muốn tự chia vùng cuộn riêng (ví dụ bảng Giao dịch: thanh lọc + phân
 * trang đứng yên, chỉ danh sách dòng cuộn) thì tự đặt `h-full flex flex-col`
 * ở gốc của trang đó — div nội dung ở đây đã truyền xuống một chiều cao xác
 * định để `h-full` có cái để tham chiếu.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const claims = await getSessionClaims();
  if (!claims) {
    redirect("/login");
  }

  const userLabel = claims.name || claims.email;

  return (
    <div className="flex h-dvh overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <DesktopNav userLabel={userLabel} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header chỉ còn cho mobile: sidebar đã đảm nhiệm nav + tên người dùng +
            đăng xuất từ `sm` trở lên. */}
        <header className="shrink-0 border-b border-zinc-200 bg-zinc-50/95 backdrop-blur-sm sm:hidden dark:border-zinc-800 dark:bg-zinc-950/95">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <h1 className="min-w-0 truncate text-base font-bold">Thống kê chi tiêu thẻ tín dụng</h1>
            <div className="flex min-w-0 shrink-0 items-center gap-2 text-sm">
              <span className="max-w-[6rem] truncate text-zinc-500 dark:text-zinc-400">{userLabel}</span>
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
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto h-full px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-8 lg:max-w-5xl">{children}</div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
