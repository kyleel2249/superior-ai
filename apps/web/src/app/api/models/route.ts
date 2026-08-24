import { NextRequest, NextResponse } from "next/server";
import {
  modelRegistry,
  listCredentialStatus,
  discoverModels,
  discoverAllConfigured,
  benchmarkModel,
  checkAllFromEnv,
  getHealthSnapshot,
} from "@superior-ai/ai-gateway";
import type { ProviderId } from "@superior-ai/core";

export async function GET(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get("provider") as ProviderId | null;
  const resolve = req.nextUrl.searchParams.get("resolve");
  const availableOnly = req.nextUrl.searchParams.get("available") === "1";

  if (resolve) {
    const result = modelRegistry.resolve(resolve);
    return NextResponse.json({
      query: resolve,
      ...result,
      note:
        result.status === "FUTURE_UNAVAILABLE" || result.status === "UNAVAILABLE"
          ? "Model is not available — route to best verified fallback; never fake responses as this model."
          : undefined,
    });
  }

  let models = modelRegistry.list(provider ? { provider } : undefined);
  if (availableOnly) {
    models = models.filter((m) => m.availability && m.status === "AVAILABLE");
  }

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
      fallbackPriority: m.fallbackPriority,
      contextWindow: m.contextWindow,
      maxOutput: m.maxOutput,
      multimodalSupport: m.multimodalSupport,
      functionCalling: m.functionCalling,
      structuredOutput: m.structuredOutput,
      aliases: m.aliases,
      scores: m.scores,
    })),
    credentials: listCredentialStatus(),
    health: getHealthSnapshot(),
    counts: {
      total: models.length,
      available: models.filter((m) => m.status === "AVAILABLE").length,
      unavailable: models.filter((m) => m.status === "UNAVAILABLE").length,
      configRequired: models.filter((m) => m.status === "CONFIGURATION_REQUIRED").length,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action ?? "");

    if (action === "discover") {
      if (body.provider) {
        const result = await discoverModels(String(body.provider) as ProviderId);
        return NextResponse.json(result);
      }
      const results = await discoverAllConfigured();
      return NextResponse.json({ results });
    }

    if (action === "health") {
      const snaps = await checkAllFromEnv();
      return NextResponse.json({ providers: snaps, cached: getHealthSnapshot() });
    }

    if (action === "benchmark") {
      const provider = String(body.provider) as ProviderId;
      const modelId = String(body.modelId ?? body.model);
      if (!provider || !modelId) {
        return NextResponse.json({ error: "provider and modelId required" }, { status: 400 });
      }
      const result = await benchmarkModel(provider, modelId);
      return NextResponse.json(result);
    }

    if (action === "resolve") {
      const result = modelRegistry.resolve(String(body.model ?? body.query ?? ""));
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: "action must be discover | health | benchmark | resolve" },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
