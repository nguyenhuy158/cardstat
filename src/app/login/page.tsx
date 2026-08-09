import { getCloudflareContext } from "@opennextjs/cloudflare";

import type { AuthEnv } from "@/infrastructure/auth/auth";

import { LoginForm } from "./login-form";

/**
 * Server component chỉ để hỏi env: nút Google chỉ hiện khi có đủ credential,
 * không thì bấm vào chỉ nhận lỗi từ provider.
 */
export default async function LoginPage() {
  const { env } = await getCloudflareContext({ async: true });
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = env as AuthEnv;

  return (
    <div className="flex min-h-dvh items-start justify-center bg-zinc-50 px-0 text-zinc-900 sm:items-center sm:px-4 dark:bg-zinc-950 dark:text-zinc-100">
      <LoginForm googleEnabled={Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET)} />
    </div>
  );
}
