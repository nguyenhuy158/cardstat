import { NextRequest, NextResponse } from "next/server";
import { isResponse, requireUser } from "@/infrastructure/auth/require-user";
import { getInsights } from "@/application/use-cases/get-insights";

export async function GET(req: NextRequest) {
  const authed = await requireUser(req);
  if (isResponse(authed)) return authed;

  const insights = await getInsights(authed.repo);
  return NextResponse.json(insights);
}
