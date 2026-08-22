import { NextRequest, NextResponse } from "next/server";
import { modelRegistry, route, configureAndValidate, getAdapter } from "@superior-ai/ai-gateway";
import { selectCouncil } from "@superior-ai/agents";
import type { IntelligenceLevel, TaskType } from "@superior-ai/core";

function classifyTask(message: string): TaskType {
  const lower = message.toLowerCase();
  if (/\b(code|build|implement|debug|refactor|api|frontend|backend|deploy)\b/.test(lower)) return "coding";
  if (/\b(research|search|find|sources|evidence|paper)\b/.test(lower)) return "research";
  if (/\b(finance|financial|revenue|cash flow|balance sheet|forecast)\b/.test(lower)) return "financial";
  if (/\b(strategy|swot|competitive|market|positioning)\b/.test(lower)) return "strategy";
  if (/\b(write|copy|blog|marketing|content|caption)\b/.test(lower)) return "creative";
  if (/\b(image|video|audio|screenshot|diagram)\b/.test(lower)) return "multimodal";
  if (/\b(analyze|analysis|report|diagnostic)\b/.test(lower)) return "analysis";
  return "chat";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = String(body.message ?? "");
    const intelligenceLevel = (body.intelligenceLevel ?? "BALANCED") as IntelligenceLevel;

    if (!message.trim()) {
      return NextResponse.json({ error: "Empty message" }, { status: 400 });
    }

    // Ensure providers from env are attempted (lazy validation)
    const envKeys: Array<{ provider: "openai" | "anthropic" | "xai" | "google" | "local"; key?: string; base?: string }> = [
      { provider: "openai", key: process.env.OPENAI_API_KEY, base: process.env.OPENAI_BASE_URL },
      { provider: "anthropic", key: process.env.ANTHROPIC_API_KEY, base: process.env.ANTHROPIC_BASE_URL },
      { provider: "xai", key: process.env.XAI_API_KEY, base: process.env.XAI_BASE_URL },
      { provider: "google", key: process.env.GOOGLE_AI_API_KEY, base: process.env.GOOGLE_AI_BASE_URL },
      { provider: "local", key: process.env.LOCAL_INFERENCE_API_KEY, base: process.env.LOCAL_INFERENCE_URL },
    ];

    for (const e of envKeys) {
      if (e.key) {
        await configureAndValidate(e.provider, { apiKey: e.key, baseUrl: e.base });
      }
    }

    const taskType = classifyTask(message);
    const routing = route({
      taskType,
      difficulty: 3,
      risk: "medium",
      requiredReasoning: true,
      requiredTools: [],
      requiredModality: ["text"],
      costSensitivity: intelligenceLevel === "FAST" ? "high" : "medium",
      latencySensitivity: intelligenceLevel === "FAST" ? "high" : "medium",
      privacyLevel: "standard",
      intelligenceLevel,
    });

    const council = selectCouncil(taskType, intelligenceLevel);
    const available = modelRegistry.list({ availableOnly: true });

    // If no live provider, return orchestration plan (honest about state)
    if (available.length === 0) {
      const plan = [
        `**Routing decision**`,
        routing.reason,
        ``,
        `**AI Council activated** (${council.length} agents):`,
        ...council.map((a) => `- ${a.displayName} (${a.role})`),
        ``,
        `**Status:** No providers currently AVAILABLE.`,
        `Configure API keys in Admin → Providers or set environment variables (OPENAI_API_KEY, ANTHROPIC_API_KEY, XAI_API_KEY, GOOGLE_AI_API_KEY, or LOCAL_INFERENCE_URL).`,
        ``,
        `Models remain REGISTERED / CONFIGURATION_REQUIRED until validated. Future aliases (e.g. GPT-7) stay UNAVAILABLE and fall back automatically when real endpoints appear.`,
        ``,
        `**Your objective received:** "${message.slice(0, 200)}${message.length > 200 ? "…" : ""}"`,
        ``,
        `Once a provider is validated, the same request will execute through the selected primary model and council.`,
      ].join("\n");

      return NextResponse.json({
        reply: plan,
        meta: "Executive Agent · Orchestration Plan",
        routing: {
          primary: routing.primary.displayName,
          status: routing.primary.status,
        },
        council: council.map((c) => c.displayName),
      });
    }

    // Execute with primary model
    const adapter = getAdapter(routing.primary.provider);
    const system = [
      `You are part of SUPERIOR AI — a multi-model autonomous expert platform.`,
      `Current role context: Executive coordinating ${council.map((c) => c.displayName).join(", ")}.`,
      `Task type: ${taskType}. Intelligence level: ${intelligenceLevel}.`,
      `Be accurate. Do not invent tool results, test outcomes, or sources.`,
      `If you need capabilities not yet executed, say so clearly.`,
    ].join("\n");

    const completion = await adapter.chat({
      model: routing.primary.modelId,
      messages: [
        { role: "system", content: system },
        { role: "user", content: message },
      ],
      temperature: 0.6,
      max_tokens: 4096,
    });

    return NextResponse.json({
      reply: completion.content,
      meta: `${routing.primary.displayName} · ${council[0]?.displayName ?? "Executive"}`,
      usage: completion.usage,
      routing: {
        primary: routing.primary.displayName,
        secondary: routing.secondary?.displayName,
        reason: routing.reason,
      },
      council: council.map((c) => c.displayName),
    });
  } catch (err) {
    console.error("[api/chat]", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : String(err),
        reply: `An error occurred while routing or calling the model: ${err instanceof Error ? err.message : String(err)}\n\nCheck provider configuration and health.`,
        meta: "System",
      },
      { status: 500 }
    );
  }
}
