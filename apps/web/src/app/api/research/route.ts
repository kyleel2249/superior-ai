import { NextRequest, NextResponse } from "next/server";
import {
  runResearch,
  formatResearchForPrompt,
  type ResearchResult,
} from "@superior-ai/agents";
import {
  handleChatCompletions,
  configureFromEnv,
} from "@superior-ai/ai-gateway";
import { rememberDurable } from "@superior-ai/memory";

/**
 * POST /api/research
 * Body: { query, urls?: string[], synthesize?: boolean, profileId?: string }
 * Fetches only user-supplied public URLs. Never invents search hits or citations.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = String(body.query ?? body.question ?? "").trim();
    if (!query) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    const urls: string[] = Array.isArray(body.urls)
      ? body.urls.map(String)
      : typeof body.url === "string"
        ? [body.url]
        : [];

    const research: ResearchResult = await runResearch({ query, urls });

    let synthesis: {
      content?: string;
      model?: string;
      provider?: string;
      reason?: string;
    } | null = null;

    if (body.synthesize === true && research.sources.some((s) => s.ok)) {
      try {
        await configureFromEnv();
        const prompt = formatResearchForPrompt(research);
        const completion = await handleChatCompletions({
          model: body.model ?? "auto",
          messages: [
            {
              role: "system",
              content:
                "You are a research synthesizer. Answer only from the provided sources. Cite URLs inline. Label inference clearly. Never invent sources, statistics, or quotes.",
            },
            {
              role: "user",
              content: `${prompt}\n\nQuestion: ${query}\n\nWrite a concise answer with citations.`,
            },
          ],
          temperature: 0.2,
          max_tokens: body.max_tokens ?? 2048,
        });
        synthesis = {
          content: completion.choices?.[0]?.message?.content,
          model: completion.superior_meta?.routed_model ?? completion.model,
          provider: completion.superior_meta?.provider,
          reason: completion.superior_meta?.reason,
        };
      } catch (err) {
        research.notes.push(
          `Synthesis failed honestly: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    if (body.remember && body.profileId) {
      await rememberDurable({
        type: "research",
        content: `Research: ${query}\nSources: ${research.sources.map((s) => s.url).join(", ")}\n${
          synthesis?.content ?? research.claims.map((c) => c.claim).join(" | ")
        }`.slice(0, 4000),
        profileId: String(body.profileId),
        organizationId: body.organizationId,
        importance: 60,
        tags: ["research"],
      });
    }

    return NextResponse.json({
      ...research,
      synthesis,
      promptPreview: formatResearchForPrompt(research).slice(0, 1500),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/research",
    method: "POST",
    body: {
      query: "string (required)",
      urls: "string[] (public http(s) URLs to fetch)",
      synthesize: "boolean — optional model answer from fetched sources only",
      remember: "boolean",
      profileId: "string",
    },
    rules: [
      "Does not invent search results or URLs",
      "Only fetches user-supplied public URLs",
      "Citations must reference returned sources",
    ],
  });
}
