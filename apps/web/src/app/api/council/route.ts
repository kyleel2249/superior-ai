import { NextRequest, NextResponse } from "next/server";
import { runCouncil, getAdapter, configureFromEnv, type CouncilMode } from "@superior-ai/ai-gateway";
import type { ProviderId } from "@superior-ai/core";

const ALL_PROVIDERS: ProviderId[] = ["openai", "anthropic", "xai", "google", "openrouter", "local"];

let configured = false;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const prompt = String(body.prompt ?? "").trim();
  if (!prompt) return NextResponse.json({ error: "prompt is required" }, { status: 400 });

  const mode: CouncilMode = ["single", "multi", "council", "supreme", "autonomous"].includes(body.mode) ? body.mode : "single";

  // Configure providers from env on first request in this process (mirrors
  // the pattern already used elsewhere — no separate "startup" hook exists).
  if (!configured) {
    configured = true;
    await configureFromEnv();
  }

  const providers: ProviderId[] = Array.isArray(body.providers) && body.providers.length > 0 ? body.providers : ALL_PROVIDERS;

  try {
    const result = await runCouncil({ prompt, providers, mode, model: body.model }, getAdapter);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
