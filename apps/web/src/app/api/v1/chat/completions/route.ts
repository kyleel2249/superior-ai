import { NextRequest, NextResponse } from "next/server";
import { handleChatCompletions, configureAndValidate } from "@superior-ai/ai-gateway";

export async function POST(req: NextRequest) {
  try {
    // Lazy env validation
    const keys = [
      { p: "openai" as const, k: process.env.OPENAI_API_KEY, b: process.env.OPENAI_BASE_URL },
      { p: "anthropic" as const, k: process.env.ANTHROPIC_API_KEY, b: process.env.ANTHROPIC_BASE_URL },
      { p: "xai" as const, k: process.env.XAI_API_KEY, b: process.env.XAI_BASE_URL },
      { p: "google" as const, k: process.env.GOOGLE_AI_API_KEY, b: process.env.GOOGLE_AI_BASE_URL },
      { p: "openrouter" as const, k: process.env.OPENROUTER_API_KEY, b: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1" },
      { p: "local" as const, k: process.env.LOCAL_INFERENCE_API_KEY, b: process.env.LOCAL_INFERENCE_URL },
    ];
    for (const x of keys) {
      if (x.k) await configureAndValidate(x.p, { apiKey: x.k, baseUrl: x.b });
    }

    const body = await req.json();
    const result = await handleChatCompletions(body);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        error: {
          message: err instanceof Error ? err.message : String(err),
          type: "superior_ai_error",
        },
      },
      { status: 500 }
    );
  }
}
