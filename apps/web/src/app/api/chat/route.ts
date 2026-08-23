import { NextRequest, NextResponse } from "next/server";
import { handleChatCompletions, configureAndValidate, type OpenAICompatRequest } from "@superior-ai/ai-gateway";
import { retrieveRelevantDurable, rememberDurable } from "@superior-ai/memory";
import { getSession, getSessionFromCookies } from "@superior-ai/auth";

/**
 * /api/chat — same underlying gateway as /api/v1/chat/completions, but adds
 * the durable-memory round trip: relevant PersistentMemory records for the
 * caller's profile/organization are retrieved and injected as a system
 * message before routing to a model, and (optionally) a summary of the
 * exchange is written back so future turns can recall it. This is the
 * feature docs/WAVE16.md described as "chat auto-memory injection" — the
 * logic already existed in packages/memory, it just was never called from
 * an API route.
 */
export async function POST(req: NextRequest) {
  try {
    const keys = [
      { p: "openai" as const, k: process.env.OPENAI_API_KEY, b: process.env.OPENAI_BASE_URL },
      { p: "anthropic" as const, k: process.env.ANTHROPIC_API_KEY, b: process.env.ANTHROPIC_BASE_URL },
      { p: "xai" as const, k: process.env.XAI_API_KEY, b: process.env.XAI_BASE_URL },
      { p: "google" as const, k: process.env.GOOGLE_AI_API_KEY, b: process.env.GOOGLE_AI_BASE_URL },
      { p: "local" as const, k: process.env.LOCAL_INFERENCE_API_KEY, b: process.env.LOCAL_INFERENCE_URL },
    ];
    for (const x of keys) {
      if (x.k) await configureAndValidate(x.p, { apiKey: x.k, baseUrl: x.b });
    }

    const body = (await req.json()) as OpenAICompatRequest & {
      profileId?: string;
      organizationId?: string;
      remember?: boolean;
    };

    const session =
      getSession(req.headers.get("authorization")) || getSessionFromCookies(req.headers.get("cookie"));
    const profileId = body.profileId ?? session?.user.id;
    const organizationId = body.organizationId ?? session?.user.organizationId;

    const lastUserMessage = [...body.messages].reverse().find((m) => m.role === "user")?.content ?? "";
    let injected = body.messages;
    let memoryUsed = 0;

    if (lastUserMessage && (profileId || organizationId)) {
      const memory = await retrieveRelevantDurable({
        query: lastUserMessage,
        profileId,
        organizationId,
        limit: 8,
      });
      memoryUsed = memory.records.length;
      if (memoryUsed > 0) {
        const memoryBlock = memory.records.map((r) => `- (${r.type}) ${r.content}`).join("\n");
        injected = [
          { role: "system", content: `Relevant memory about this user/organization:\n${memoryBlock}` },
          ...body.messages,
        ];
      }
    }

    const result = await handleChatCompletions({ ...body, messages: injected });

    if (body.remember && profileId && lastUserMessage) {
      const replyContent =
        (result as { choices?: Array<{ message?: { content?: string } }> }).choices?.[0]?.message?.content ?? "";
      await rememberDurable({
        type: "conversation",
        content: `User asked: ${lastUserMessage}\nAssistant replied: ${replyContent}`.slice(0, 4000),
        profileId,
        organizationId,
        importance: 40,
      });
    }

    return NextResponse.json({ ...result, memory: { injected: memoryUsed } });
  } catch (err) {
    return NextResponse.json(
      { error: { message: err instanceof Error ? err.message : String(err), type: "superior_ai_error" } },
      { status: 500 }
    );
  }
}
