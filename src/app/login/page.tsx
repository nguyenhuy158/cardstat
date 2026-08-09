import { redirect } from "next/navigation";

import { getSessionClaims } from "@/infrastructure/auth/session";

export const metadata = { title: "Đăng nhập - Thống kê chi tiêu thẻ" };

/** Logo Google 4 màu, vẽ tay vì repo không có bộ icon brand. */
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A8.99 8.99 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.94H.96a8.99 8.99 0 0 0 0 8.12l3.01-2.34Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A8.99 8.99 0 0 0 .96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

/**
 * Trang đăng nhập chỉ còn một đường: chuyển sang SSO dùng chung của domain.
 * Không còn form username/mật khẩu nên đây là server component — không state,
 * không JS phía client.
 */
export default async function LoginPage() {
  if (await getSessionClaims()) {
    redirect("/");
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-50 px-4 py-6 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 text-center sm:p-7 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-lg font-bold sm:text-xl">Thống kê chi tiêu thẻ tín dụng</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Đăng nhập bằng tài khoản huyab.click
        </p>

        <a
          href="/api/auth/sso"
          className="mt-6 flex min-h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-zinc-200 px-4 font-medium transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <GoogleMark />
          <span>Tiếp tục với Google</span>
        </a>

        <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-500">
          Đăng nhập một lần, dùng chung cho các app trên huyab.click.
        </p>
      </div>
    </div>
  );
}
