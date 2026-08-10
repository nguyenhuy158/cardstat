import { NextRequest, NextResponse } from "next/server";
import { isResponse, requireUser } from "@/infrastructure/auth/require-user";
import { getBudgets } from "@/application/use-cases/get-budgets";
import { setBudget } from "@/application/use-cases/set-budget";

export async function GET(req: NextRequest) {
  const authed = await requireUser(req);
  if (isResponse(authed)) return authed;

  const month = req.nextUrl.searchParams.get("month") ?? undefined;
  const budgets = await getBudgets(authed.repo, month ?? undefined);
  return NextResponse.json(budgets);
}

export async function PUT(req: NextRequest) {
  const authed = await requireUser(req);
  if (isResponse(authed)) return authed;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body không phải JSON hợp lệ" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("category" in body) ||
    !("limit" in body) ||
    typeof (body as { category: unknown }).category !== "string" ||
    typeof (body as { limit: unknown }).limit !== "number" ||
    !Number.isFinite((body as { limit: unknown }).limit)
  ) {
    return NextResponse.json({ error: "Cần category (string) và limit (number)" }, { status: 400 });
  }

  const { category, limit } = body as { category: string; limit: number };
  if (!category.trim()) {
    return NextResponse.json({ error: "category không được rỗng" }, { status: 400 });
  }

  await setBudget(authed.repo, category, limit);
  return NextResponse.json({ ok: true });
}
