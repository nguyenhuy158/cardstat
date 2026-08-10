"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ICONS, NAV_ITEMS } from "../bottom-nav";

/**
 * Sidebar cho `sm` trở lên, thay cho dãy link ngang nhét chung hàng với tiêu
 * đề trong header cũ — bốn mục + tiêu đề dài + tên người dùng + nút đăng xuất
 * chen một hàng bị chật, khó bấm đúng mục trên các độ rộng màn hình vừa
 * (laptop 13", cửa sổ chia đôi). Sidebar cho mỗi mục icon + nhãn riêng một
 * hàng nên vùng bấm rộng hơn hẳn, và không còn cạnh tranh chỗ với phần còn
 * lại của header.
 *
 * `h-screen`: layout.tsx khoá cả khung theo `h-dvh` và để riêng vùng nội dung
 * cuộn (không phải cả trang), nên sidebar vốn đã đứng yên — `sticky top-0`
 * chỉ còn là lưới an toàn, không thật sự có ngữ cảnh cuộn nào để dính vào.
 */
export function DesktopNav({ userLabel }: { userLabel: string }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-zinc-200 bg-white sm:flex dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
        <p className="text-base font-bold">Cardstat</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Thống kê chi tiêu thẻ</p>
      </div>

      <nav aria-label="Điều hướng chính" className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname === item.href;
          const Icon = NAV_ICONS[item.href];
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "true" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                isActive
                  ? "bg-zinc-900 font-semibold text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900"
                  : "font-medium text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              <Icon />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
        <p className="mb-2 truncate text-sm text-zinc-500 dark:text-zinc-400">{userLabel}</p>
        {/* Thẻ <a>: đăng xuất là điều hướng sang SSO, không phải gọi API. */}
        <a
          href="/api/auth/logout"
          className="flex h-10 items-center justify-center rounded-lg border border-zinc-200 text-sm font-medium transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Đăng xuất
        </a>
      </div>
    </aside>
  );
}
