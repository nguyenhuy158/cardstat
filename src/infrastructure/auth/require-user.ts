import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

import type { TransactionRepository } from "@/domain/ports/transaction-repository";
import { getTransactionRepository } from "@/infrastructure/persistence/get-repository";

import { getClaimsFromRequest, resolveUserId } from "./session";

export type AuthedContext = {
  userId: string;
  repo: TransactionRepository;
};

/**
 * Composition root cho request đã đăng nhập: xác thực cookie SSO rồi cắm adapter
 * D1 đã khoá theo user vào port TransactionRepository. Mọi route ghi/đọc giao
 * dịch phải đi qua đây: kiểm tra ở layout chỉ là UX (đẩy trình duyệt sang
 * /login), ranh giới bảo mật nằm ở API.
 *
 * Trả về `Response` 401 khi chưa đăng nhập, ngược lại trả context.
 */
export async function requireUser(req: Request): Promise<AuthedContext | Response> {
  const claims = await getClaimsFromRequest(req);
  if (!claims) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { env } = await getCloudflareContext({ async: true });
  const userId = await resolveUserId(env.DB, claims);
  return {
    userId,
    repo: await getTransactionRepository(userId),
  };
}

export function isResponse(value: AuthedContext | Response): value is Response {
  return value instanceof Response;
}
