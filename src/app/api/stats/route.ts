import { NextRequest, NextResponse } from "next/server";
import { isResponse, requireUser } from "@/infrastructure/auth/require-user";
import { getStats } from "@/application/use-cases/get-stats";

export async function GET(req: NextRequest) {
  const authed = await requireUser(req);
  if (isResponse(authed)) return authed;

  const stats = await getStats(authed.repo);
  return NextResponse.json(stats);
}
