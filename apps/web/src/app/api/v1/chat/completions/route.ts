import { NextRequest, NextResponse } from "next/server";
import { handleChatCompletions, configureAndValidate } from "@superior-ai/ai-gateway";

// Every model call is routed through OpenRouter — see packages/ai-gateway/src/providers/index.ts.
// Re-validating on every request is wasteful in production; this is fine for now but should
// move to a cached/periodic health check once this sees real traffic.
export async function POST(req: NextRequest) {
  try {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) {
      return NextResponse.json(
        { error: { message: "OPENROUTER_API_KEY is not set.", type: "superior_ai_error" } },
        { status: 503 }
      );
    }
    const validated = await configureAndValidate("openrouter", {
      apiKey: key,
      baseUrl: process.env.OPENROUTER_BASE_URL,
    });
    if (!validated.ok) {
      return NextResponse.json(
        { error: { message: validated.message, type: "superior_ai_error" } },
        { status: 502 }
      );
    }
    const body = await req.json();
    const result = await handleChatCompletions(body);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: { message: err instanceof Error ? err.message : String(err), type: "superior_ai_error" } }, { status: 500 });
  }
}
