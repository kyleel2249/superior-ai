import { NextRequest, NextResponse } from "next/server";
import { retrieveRelevantDurable, formatMemoryForPrompt } from "@superior-ai/memory";

/**
 * Simple memory-aware chat endpoint. Distinct from /api/v1/chat/completions
 * (the OpenAI-compatible surface): this one auto-retrieves relevant durable
 * memory before calling the model, so callers don't have to wire that up
 * themselves.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = String(body.message ?? "").trim();
    if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });

    const { records, backend: memoryBackend } = await retrieveRelevantDurable({
      query: message,
      profileId: body.profileId,
      organizationId: body.organizationId,
      projectId: body.projectId,
      limit: 12,
    });
    const memoryBlock = formatMemoryForPrompt(records);
    const memoryUsed = records.length > 0;

    const key = process.env.OPENROUTER_API_KEY;
    if (!key) {
      return NextResponse.json({
        reply: null,
        memoryUsed,
        memoryBackend,
        memoryBlock,
        note: "OPENROUTER_API_KEY not set — returning retrieved memory only, no model call was made.",
      });
    }

    const gateway = await import("@superior-ai/ai-gateway");
    const validated = await gateway.configureAndValidate("openrouter", { apiKey: key, baseUrl: process.env.OPENROUTER_BASE_URL });
    if (!validated.ok) {
      return NextResponse.json({ reply: null, memoryUsed, memoryBackend, memoryBlock, error: validated.message }, { status: 502 });
    }

    const completion = await gateway.handleChatCompletions({
      model: body.model ?? "auto",
      messages: [
        ...(memoryBlock ? [{ role: "system" as const, content: memoryBlock }] : []),
        { role: "user" as const, content: message },
      ],
    });

    return NextResponse.json({
      reply: completion.choices?.[0]?.message?.content ?? null,
      modelUsed: completion.model,
      memoryUsed,
      memoryBackend,
      memoryBlock,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
