import { NextRequest, NextResponse } from "next/server";
import { modelRegistry } from "@superior-ai/ai-gateway";
import type { ProviderId, IntelligenceLevel } from "@superior-ai/core";

export async function GET(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get("provider") as ProviderId | null;
  const intelligenceLevel = req.nextUrl.searchParams.get("intelligenceLevel") as IntelligenceLevel | null;
  const models = modelRegistry.list({
    provider: provider ?? undefined,
    intelligenceLevel: intelligenceLevel ?? undefined,
  });
  return NextResponse.json({ models, count: models.length });
}
