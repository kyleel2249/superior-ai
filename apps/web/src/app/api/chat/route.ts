import { NextRequest, NextResponse } from "next/server";
import { handleChatCompletions, configureAndValidate, type OpenAICompatRequest } from "@superior-ai/ai-gateway";
import {
  retrieveRelevantDurable,
  rememberDurable,
  buildRagContext,
  memoryBackendStatus,
} from "@superior-ai/memory";
import { getSession, getSessionFromCookies } from "@superior-ai/auth";

/**
 * /api/chat — gateway + durable memory + RAG by default.
 * Memory and knowledge-context injection run on every turn when a query exists.
 * `remember` defaults to true. Never invents memory contents.
 */
export async function POST(req: NextRequest) {
  try {
    const keys = [
      { p: "openai" as const, k: process.env.OPENAI_API_KEY, b: process.env.OPENAI_BASE_URL },
      { p: "anthropic" as const, k: process.env.ANTHROPIC_API_KEY, b: process.env.ANTHROPIC_BASE_URL },
      { p: "xai" as const, k: process.env.XAI_API_KEY, b: process.env.XAI_BASE_URL },
      { p: "google" as const, k: process.env.GOOGLE_AI_API_KEY, b: process.env.GOOGLE_AI_BASE_URL },
      { p: "local" as const, k: process.env.LOCAL_INFERENCE_API_KEY, b: process.env.LOCAL_INFERENCE_URL },
      { p: "openrouter" as const, k: process.env.OPENROUTER_API_KEY, b: process.env.OPENROUTER_BASE_URL },
    ];
    for (const x of keys) {
      if (x.k) await configureAndValidate(x.p, { apiKey: x.k, baseUrl: x.b });
    }

    const body = (await req.json()) as OpenAICompatRequest & {
      profileId?: string;
      organizationId?: string;
      projectId?: string;
      remember?: boolean;
      useRag?: boolean;
      useMemory?: boolean;
    };

    const session =
      getSession(req.headers.get("authorization")) || getSessionFromCookies(req.headers.get("cookie"));
    const profileId = body.profileId ?? session?.user.id ?? "local-user";
    const organizationId = body.organizationId ?? session?.user.organizationId;
    const projectId = body.projectId;
    const useMemory = body.useMemory !== false;
    const useRag = body.useRag !== false;
    const remember = body.remember !== false;

    const lastUserMessage = [...body.messages].reverse().find((m) => m.role === "user")?.content ?? "";
    const systemParts: string[] = [];
    let memoryUsed = 0;
    let ragChunks = 0;
    const backend = await memoryBackendStatus();

    if (lastUserMessage && useMemory) {
      const memory = await retrieveRelevantDurable({
        query: lastUserMessage,
        profileId,
        organizationId,
        projectId,
        limit: 10,
      });
      memoryUsed = memory.records.length;
      if (memoryUsed > 0) {
        const memoryBlock = memory.records
          .map((r) => `- (${r.type}${r.key ? `:${r.key}` : ""}) ${r.content}`)
          .join("\n");
        systemParts.push(`Relevant durable memory (backend=${memory.backend}):\n${memoryBlock}`);
      }
    }

    if (lastUserMessage && useRag) {
      const rag = buildRagContext(lastUserMessage, 6);
      if (rag) {
        ragChunks = (rag.match(/## /g) ?? []).length;
        systemParts.push(
          `Knowledge base context (lexical RAG — cite only if relevant):\n${rag}`
        );
      }
    }

    let injected = body.messages;
    if (systemParts.length > 0) {
      injected = [
        {
          role: "system",
          content:
            systemParts.join("\n\n---\n\n") +
            "\n\nUse memory and knowledge only when relevant. Do not invent facts, contacts, or sources.",
        },
        ...body.messages,
      ];
    }

    const result = await handleChatCompletions({ ...body, messages: injected });

    if (remember && profileId && lastUserMessage) {
      const replyContent =
        (result as { choices?: Array<{ message?: { content?: string } }> }).choices?.[0]?.message
          ?.content ?? "";
      await rememberDurable({
        type: "conversation",
        content: `User: ${lastUserMessage}\nAssistant: ${replyContent}`.slice(0, 4000),
        profileId,
        organizationId,
        projectId,
        importance: 40,
        tags: ["chat", "auto"],
      });
    }

    return NextResponse.json({
      ...result,
      memory: {
        injected: memoryUsed,
        ragChunks,
        backend,
        remembered: remember,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: { message: err instanceof Error ? err.message : String(err), type: "superior_ai_error" } },
      { status: 500 }
    );
  }
}
