import { NextRequest, NextResponse } from "next/server";
import {
  modelRegistry,
  ensureCintexaRegistry,
  userModeToReasoning,
  mapReasoningToProvider,
  CINTEXA_SEED_MODELS,
  planCascade,
  planCouncil,
  planDisagreement,
  councilWithCascade,
  evaluateQuality,
  qualityGate,
} from "@superior-ai/ai-gateway";
import {
  creditPolicy,
  assertCreditsAvailable,
  listUsageAccounting,
  recordUsageAccounting,
} from "@superior-ai/billing";

export async function GET(req: NextRequest) {
  ensureCintexaRegistry();
  const view = req.nextUrl.searchParams.get("view") ?? "overview";
  if (view === "models") {
    const models = modelRegistry.list().filter((m) => m.metadata?.cintexa || m.provider === "openrouter");
    return NextResponse.json({
      count: models.length,
      models: models.map((m) => ({
        id: m.id,
        displayName: m.displayName,
        status: m.status,
        provider: m.provider,
        underlying: m.metadata?.underlyingProvider,
        openrouter_model_id: m.metadata?.openrouter_model_id ?? m.modelId,
        aliases: m.aliases,
      })),
    });
  }
  if (view === "credits") {
    return NextResponse.json({ policy: creditPolicy(), assert: assertCreditsAvailable() });
  }
  if (view === "usage") {
    return NextResponse.json({ ledger: listUsageAccounting(50) });
  }
  if (view === "seeds") {
    return NextResponse.json({ seedCount: CINTEXA_SEED_MODELS.length });
  }
  return NextResponse.json({
    platform: "SUPERIOR AI / CINTEXA NEXUS",
    gateway: "openrouter",
    credits: creditPolicy(),
    views: ["models", "credits", "usage", "seeds"],
    note: "Cloud inference defaults to OPENROUTER_API_KEY. Self-hosted endpoints remain separate.",
  });
}

export async function POST(req: NextRequest) {
  try {
    ensureCintexaRegistry();
    const body = await req.json();
    const action = String(body.action ?? "resolve");

    if (action === "resolve") {
      const name = String(body.model ?? body.requested ?? "");
      const result = modelRegistry.resolve(name);
      return NextResponse.json(result);
    }
    if (action === "reasoning") {
      const level = userModeToReasoning(body.mode ?? "Auto");
      return NextResponse.json({
        level,
        providerHints: mapReasoningToProvider(level, String(body.underlying ?? "openai")),
      });
    }
    if (action === "account_usage") {
      const entry = recordUsageAccounting({
        organizationId: body.organizationId,
        userId: body.userId,
        modelId: body.modelId,
        provider: body.provider,
        inputTokens: body.inputTokens,
        outputTokens: body.outputTokens,
        estimatedCostUsd: body.estimatedCostUsd,
        taskType: body.taskType,
        note: "analytics only — internal credits unlimited",
      });
      return NextResponse.json({ entry, credits: assertCreditsAvailable() });
    }


    if (action === "cascade") {
      return NextResponse.json(planCascade(String(body.text ?? body.objective ?? "")));
    }
    if (action === "council") {
      return NextResponse.json(planCouncil(String(body.objective ?? body.text ?? "")));
    }
    if (action === "disagreement") {
      return NextResponse.json(
        planDisagreement(String(body.claimA ?? ""), String(body.claimB ?? ""))
      );
    }
    if (action === "council_cascade") {
      return NextResponse.json(councilWithCascade(String(body.objective ?? body.text ?? "")));
    }
    if (action === "quality") {
      const report = evaluateQuality({
        outputText: String(body.outputText ?? body.output ?? ""),
        instruction: body.instruction,
        requireCitations: body.requireCitations === true,
        requireCode: body.requireCode === true,
        highRisk: body.highRisk === true,
        threshold: body.threshold,
      });
      return NextResponse.json(qualityGate(report, body.threshold ?? 70));
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
