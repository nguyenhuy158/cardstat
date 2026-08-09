import { NextResponse } from "next/server";
import { getTransactionRepository } from "@/infrastructure/persistence/get-repository";
import { getStats } from "@/application/use-cases/get-stats";

export async function GET() {
  const repo = getTransactionRepository();
  const stats = await getStats(repo);
  return NextResponse.json(stats);
}
