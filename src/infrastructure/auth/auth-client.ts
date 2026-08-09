"use client";

import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: typeof window === "undefined" ? undefined : `${window.location.origin}/api/auth`,
  plugins: [usernameClient()],
  fetchOptions: { credentials: "include" },
});

/**
 * Better Auth bắt buộc có email khi đăng ký, còn app này chỉ dùng username.
 * Sinh một email nội bộ từ username để không phải hỏi người dùng.
 */
export function usernameToEmail(username: string): string {
  return `${username.toLowerCase()}@cardstat.local`;
}
