import { LoginForm } from "./login-form";

/**
 * Trang đăng nhập: nút Google luôn hiện, không cần đọc env Cloudflare ở
 * đây nữa — nếu provider chưa cấu hình, lỗi sẽ đến từ better-auth khi bấm.
 */
export default function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-50 px-0 py-6 text-zinc-900 sm:px-4 dark:bg-zinc-950 dark:text-zinc-100">
      <LoginForm />
    </div>
  );
}
