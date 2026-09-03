import { NextResponse } from "next/server";
import { computeSoc2Readiness } from "@superior-ai/security";

// Repo root from this file's location: apps/web/src/app/api/compliance/readiness -> ../../../../../../..
import path from "path";

export async function GET() {
  const repoRoot = path.join(process.cwd(), "..", "..");
  const readiness = computeSoc2Readiness(repoRoot);
  return NextResponse.json(readiness);
}
