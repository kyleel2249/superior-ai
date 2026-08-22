import { NextResponse } from "next/server";
import { modelRegistry } from "@superior-ai/ai-gateway";

export async function GET() {
  const models = modelRegistry.list();
  return NextResponse.json({
    models: models.map((m) => ({
      id: m.id,
      provider: m.provider,
      modelId: m.modelId,
      displayName: m.displayName,
      status: m.status,
      availability: m.availability,
      healthScore: m.healthScore,
      priority: m.priority,
      aliases: m.aliases,
      scores: m.scores,
    })),
  });
}
