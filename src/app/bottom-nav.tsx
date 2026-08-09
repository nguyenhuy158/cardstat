"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Danh sách route + nhãn dùng chung cho bottom-nav (mobile) và nav ngang
 * trong header (desktop) — một nguồn duy nhất để hai nơi không lệch nhau.
 */
export const NAV_ITEMS: { href: "/" | "/upload" | "/charts" | "/transactions"; label: string }[] = [
  { href: "/", label: "Tổng quan" },
  { href: "/upload", label: "Nhập" },
  { href: "/charts", label: "Biểu đồ" },
  { href: "/transactions", label: "Giao dịch" },
];

function OverviewIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden>
      <rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M10 12V4m0 0-3 3m3-3 3 3M4 14v1.5A1.5 1.5 0 0 0 5.5 17h9a1.5 1.5 0 0 0 1.5-1.5V14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChartsIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden>
      <path d="M4 16V9m6 7V4m6 12v-6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M3 17h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function TransactionsIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden>
      <path d="M4 6h12M4 10h12M4 14h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const ICONS: Record<string, () => React.ReactNode> = {
  "/": OverviewIcon,
  "/upload": UploadIcon,
  "/charts": ChartsIcon,
  "/transactions": TransactionsIcon,
};

/**
 * Thanh điều hướng dưới cùng cho mobile — mỗi mục là một route thật
 * (`next/link`), không phải cuộn trong trang. `pathname === "/"` phải so
 * khớp tuyệt đối, không thì "Tổng quan" sẽ sáng ở mọi route.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Điều hướng chính"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-zinc-200 bg-zinc-50/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm sm:hidden dark:border-zinc-800 dark:bg-zinc-950/95"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = item.href === "/" ? pathname === "/" : pathname === item.href;
        const Icon = ICONS[item.href];
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "true" : undefined}
            className={`flex min-h-11 flex-col items-center justify-center gap-0.5 py-2 text-zinc-500 transition dark:text-zinc-400 ${
              isActive ? "text-zinc-900 dark:text-zinc-100" : ""
            }`}
          >
            <Icon />
            <span className={isActive ? "text-[10px] font-semibold" : "text-[10px] font-medium"}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
