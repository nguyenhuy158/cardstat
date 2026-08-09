import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { drizzle } from "drizzle-orm/d1";

import * as schema from "./schema";

/**
 * Biến môi trường của auth nằm ở `.dev.vars` (local) hoặc `wrangler secret` (prod),
 * nên chúng không có trong CloudflareEnv do `wrangler types` sinh ra.
 */
export type AuthEnv = CloudflareEnv & {
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
};

const DEV_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"];

function parseOrigin(requestUrl: string): string {
  try {
    return new URL(requestUrl).origin;
  } catch {
    return DEV_ORIGINS[0];
  }
}

function getTrustedOrigins(env: AuthEnv, requestUrl: string): string[] {
  const origins = new Set(DEV_ORIGINS);
  origins.add(parseOrigin(requestUrl));
  if (env.BETTER_AUTH_URL) origins.add(parseOrigin(env.BETTER_AUTH_URL));
  return [...origins];
}

/**
 * Chỉ bật Google khi có đủ cả hai biến. Thiếu một trong hai thì better-auth ném
 * lỗi lúc khởi tạo, tức là dev máy mới không chạy được nếu không xin credential.
 */
function getSocialProviders(env: AuthEnv) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return undefined;
  return {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  };
}

export function createAuth(env: AuthEnv, requestUrl: string) {
  const db = drizzle(env.DB, { schema });

  return betterAuth({
    database: drizzleAdapter(db, { provider: "sqlite", schema }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL || parseOrigin(requestUrl),
    basePath: "/api/auth",
    trustedOrigins: getTrustedOrigins(env, requestUrl),
    emailAndPassword: { enabled: true },
    socialProviders: getSocialProviders(env),
    /**
     * Bộ đếm mặc định nằm trong memory của isolate, trên Workers thì mỗi isolate
     * đếm riêng nên đây là lớp chặn mềm, không phải hạn mức chính xác.
     */
    rateLimit: {
      enabled: true,
      window: 60,
      max: 100,
      customRules: {
        "/sign-in/username": { window: 60, max: 10 },
        "/sign-in/email": { window: 60, max: 10 },
        "/sign-up/email": { window: 60, max: 5 },
      },
    },
    onAPIError: {
      onError(error) {
        console.error("Better Auth error:", error);
      },
    },
    plugins: [username()],
  });
}
