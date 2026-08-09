"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS } from "../bottom-nav";

/**
 * Nav ngang trong header, chỉ hiện từ `sm` trở lên — bottom-nav bị ẩn ở
 * desktop nên đây là cách duy nhất để tới `/upload`, `/charts`, `/transactions`
 * trên màn hình lớn. Dùng chung `NAV_ITEMS` với bottom-nav để không lệch route.
 */
export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Điều hướng chính (desktop)" className="hidden items-center gap-1 sm:flex">
      {NAV_ITEMS.map((item) => {
        const isActive = item.href === "/" ? pathname === "/" : pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "true" : undefined}
            className={`rounded-lg px-3 py-2 text-sm transition ${
              isActive
                ? "bg-zinc-900 font-semibold text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-500 font-medium hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
