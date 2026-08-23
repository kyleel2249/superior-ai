import { NextRequest, NextResponse } from "next/server";
import {
  modelRegistry,
  configureAndValidate,
  configureFromEnv,
} from "@superior-ai/ai-gateway";
import type { ProviderId, IntelligenceLevel } from "@superior-ai/core";

/**
 * GET /api/models
 *
 * Honest model status. By default returns the registry as-is (models start as
 * CONFIGURATION_REQUIRED). Pass ?probe=1 to run live health checks against any
 * providers that have API keys in the environment — only then can status flip
 * to AVAILABLE.
 */
export async function GET(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get("provider") as ProviderId | null;
  const intelligenceLevel = req.nextUrl.searchParams.get(
    "intelligenceLevel"
  ) as IntelligenceLevel | null;
  const probe = req.nextUrl.searchParams.get("probe") === "1";

  let probeResults: Array<{ provider: ProviderId; ok: boolean; message: string }> | undefined;

  if (probe) {
    try {
      probeResults = await configureFromEnv();
    } catch (err) {
      probeResults = [
        {
          provider: "openai",
          ok: false,
          message: err instanceof Error ? err.message : String(err),
        },
      ];
    }
  }

  const models = modelRegistry.list({
    provider: provider ?? undefined,
    intelligenceLevel: intelligenceLevel ?? undefined,
  });

  const available = models.filter((m) => m.availability).length;
  const configurationRequired = models.filter(
    (m) => m.status === "CONFIGURATION_REQUIRED"
  ).length;

  return NextResponse.json({
    models,
    count: models.length,
    available,
    configurationRequired,
    probed: probe,
    probeResults,
    note:
      available === 0
        ? "No models are AVAILABLE yet. Set provider API keys in .env and call GET /api/models?probe=1."
        : undefined,
  });
}

/**
 * POST /api/models — admin-style re-validate a single provider with explicit credentials.
 * Does not invent success: health check must pass against the live endpoint.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const provider = body.provider as ProviderId | undefined;
    if (!provider) {
      return NextResponse.json({ error: "provider is required" }, { status: 400 });
    }
    const result = await configureAndValidate(provider, {
      apiKey: body.apiKey ?? process.env[`${provider.toUpperCase().replace("-", "_")}_API_KEY`],
      baseUrl: body.baseUrl,
    });
    const models = modelRegistry.list({ provider });
    return NextResponse.json({ ...result, models });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
