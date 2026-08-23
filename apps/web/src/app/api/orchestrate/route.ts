import { NextRequest, NextResponse } from "next/server";
import { runOrchestrator } from "@superior-ai/agents";
import {
  handleChatCompletions,
  configureFromEnv,
  type OpenAICompatRequest,
} from "@superior-ai/ai-gateway";

/**
 * POST /api/orchestrate
 *
 * mode=execute_safe | plan_only → deterministic plan only (default, safe).
 * mode=execute → plan + real model synthesis when a provider is configured.
 * Never invents synthesis content if the model call fails.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const objective = String(body.objective ?? body.message ?? "").trim();
    if (!objective) {
      return NextResponse.json({ error: "objective required" }, { status: 400 });
    }

    const mode = (body.mode as string) || "execute_safe";

    if (mode === "execute") {
      try {
        await configureFromEnv();
      } catch {
        /* continue — orchestrator will report failure honestly */
      }
    }

    const result = await runOrchestrator({
      objective,
      mode: mode as "execute_safe" | "plan_only" | "execute",
      region: body.region,
      product: body.product,
      audience: body.audience,
      competitorUrls: body.competitorUrls,
      userId: body.userId,
      projectId: body.projectId,
      chat:
        mode === "execute"
          ? async (messages) => {
              const completion = await handleChatCompletions({
                model: body.model ?? "auto",
                messages: messages as OpenAICompatRequest["messages"],
                temperature: 0.4,
                max_tokens: body.max_tokens ?? 2048,
              });
              return {
                content:
                  completion.choices?.[0]?.message?.content ??
                  "(empty model response)",
                model: completion.superior_meta?.routed_model ?? completion.model,
                provider: completion.superior_meta?.provider,
                reason: completion.superior_meta?.reason,
              };
            }
          : undefined,
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
