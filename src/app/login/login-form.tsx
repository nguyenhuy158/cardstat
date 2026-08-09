"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { authClient, usernameToEmail } from "@/infrastructure/auth/auth-client";

type AuthMode = "sign-in" | "sign-up";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  INVALID_USERNAME_OR_PASSWORD: "Sai username hoặc mật khẩu.",
  USERNAME_IS_ALREADY_TAKEN: "Username đã có người dùng.",
  USER_ALREADY_EXISTS: "Tài khoản đã tồn tại.",
};

const USERNAME_PATTERN = /^[a-zA-Z0-9_.]+$/;

function validate(username: string, password: string): string {
  if (username.length < 3) return "Username tối thiểu 3 ký tự";
  if (username.length > 30) return "Username tối đa 30 ký tự";
  if (!USERNAME_PATTERN.test(username)) return "Chỉ dùng chữ, số, dấu chấm và gạch dưới";
  if (password.length < 8) return "Mật khẩu tối thiểu 8 ký tự";
  if (password.length > 128) return "Mật khẩu quá dài";
  return "";
}

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

// text-base (không phải text-sm) để Safari trên iOS không tự zoom khi focus input.
const FIELD_CLASS =
  "max-sm:min-h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 py-3 text-base outline-none focus:border-zinc-400 sm:py-2 sm:text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:focus:border-zinc-500";

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googlePending, setGooglePending] = useState(false);

  // Đã đăng nhập mà mở /login thì đẩy về trang chủ.
  useEffect(() => {
    if (!isPending && session?.user) router.replace("/");
  }, [isPending, session, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = username.trim();
    const invalid = validate(trimmed, password);
    if (invalid) {
      setError(invalid);
      return;
    }

    setError("");
    setSubmitting(true);
    const result =
      mode === "sign-in"
        ? await authClient.signIn.username({ username: trimmed, password })
        : await authClient.signUp.email({
            email: usernameToEmail(trimmed),
            name: trimmed,
            username: trimmed,
            password,
          });
    setSubmitting(false);

    if (result.error) {
      const code = result.error.code || "";
      setError(AUTH_ERROR_MESSAGES[code] || result.error.message || "Có lỗi xảy ra, thử lại sau.");
      return;
    }

    router.replace("/");
    router.refresh();
  }

  async function handleGoogleSignIn() {
    setError("");
    setGooglePending(true);
    // Thành công thì browser bị redirect sang Google, không quay lại đây.
    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL: `${window.location.origin}/`,
    });
    setGooglePending(false);
    if (result.error) {
      setError(result.error.message || "Không mở được đăng nhập Google.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full border-y border-zinc-200 bg-white p-5 sm:max-w-md sm:rounded-xl sm:border-x sm:p-6 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <p className="text-sm font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">
        Cardstat
      </p>
      <h1 className="mt-2 text-2xl font-semibold">
        {mode === "sign-in" ? "Đăng nhập" : "Đăng ký"}
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        {mode === "sign-in"
          ? "Đăng nhập bằng username và mật khẩu."
          : "Tạo tài khoản mới để quản lý sao kê của riêng bạn."}
      </p>

      <div className="mt-5 space-y-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Username</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={FIELD_CLASS}
            placeholder="Tên đăng nhập"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Mật khẩu</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className={FIELD_CLASS}
            placeholder="********"
            name="password"
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          />
        </label>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        aria-busy={submitting}
        className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {submitting ? "Đang xử lý..." : mode === "sign-in" ? "Đăng nhập" : "Đăng ký"}
      </button>

      {googleEnabled && (
        <>
          <div className="my-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">hoặc</span>
            <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googlePending}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          >
            <GoogleMark />
            {googlePending ? "Đang chuyển..." : "Tiếp tục với Google"}
          </button>
        </>
      )}

      <button
        type="button"
        onClick={() => {
          setMode(mode === "sign-in" ? "sign-up" : "sign-in");
          setError("");
        }}
        className="mt-3 w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
      >
        {mode === "sign-in" ? "Chưa có tài khoản? Đăng ký" : "Đã có tài khoản? Đăng nhập"}
      </button>
    </form>
  );
}
