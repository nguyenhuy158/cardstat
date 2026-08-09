import { NextRequest, NextResponse } from "next/server";
import { isResponse, requireUser } from "@/infrastructure/auth/require-user";
import { listUploads } from "@/application/use-cases/list-uploads";

export async function GET(req: NextRequest) {
  const authed = await requireUser(req);
  if (isResponse(authed)) return authed;

  return NextResponse.json(await listUploads(authed.repo));
}
