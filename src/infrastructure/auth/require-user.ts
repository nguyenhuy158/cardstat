import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

import type { TransactionRepository } from "@/domain/ports/transaction-repository";
import { getTransactionRepository } from "@/infrastructure/persistence/get-repository";

import { createAuth, type AuthEnv } from "./auth";

export type AuthedContext = {
  userId: string;
  repo: TransactionRepository;
};

/**
 * Composition root cho request đã đăng nhập: xác thực session rồi cắm adapter D1
 * đã khoá theo user vào port TransactionRepository. Mọi route ghi/đọc giao dịch
 * phải đi qua đây — kiểm tra ở client chỉ là UX, ranh giới bảo mật nằm ở API.
 *
 * Trả về `Response` 401 khi chưa đăng nhập, ngược lại trả context.
 */
export async function requireUser(req: Request): Promise<AuthedContext | Response> {
  const { env } = await getCloudflareContext({ async: true });
  const auth = createAuth(env as AuthEnv, req.url);
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return {
    userId: session.user.id,
    repo: await getTransactionRepository(session.user.id),
  };
}

export function isResponse(value: AuthedContext | Response): value is Response {
  return value instanceof Response;
}
