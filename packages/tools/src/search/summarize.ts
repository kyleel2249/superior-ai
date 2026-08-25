/**
 * Search result summarization
 *
 * 1) Extractive (always): rank snippets, no model required
 * 2) Abstractive (optional): AI rewrite when gateway + key available
 *
 * Never invents sources — only uses provided hits.
 */

import type { SearchHit } from "./types";

export interface ExtractiveSummary {
  mode: "extractive";
  query: string;
  bulletPoints: string[];
  topSources: Array<{ title: string; url: string; engine?: string }>;
  answerSnippet?: string;
  note: string;
}

export interface AbstractiveSummary {
  mode: "abstractive" | "extractive_fallback";
  query: string;
  summary: string;
  bulletPoints: string[];
  topSources: Array<{ title: string; url: string; engine?: string }>;
  modelId?: string;
  note: string;
}

export type SearchSummary = ExtractiveSummary | AbstractiveSummary;

/** Score hit relevance by simple query-term overlap in title+snippet */
function relevanceScore(hit: SearchHit, query: string): number {
  const terms = query
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length > 2);
  if (!terms.length) return 0;
  const text = `${hit.title} ${hit.snippet}`.toLowerCase();
  let score = 0;
  for (const t of terms) {
    if (text.includes(t)) score += 1;
  }
  if (hit.snippet && hit.snippet.length > 40) score += 0.5;
  return score;
}

/**
 * Deterministic extractive summary from search hits.
 * Safe offline / no API key.
 */
export function summarizeSearchExtractive(
  query: string,
  hits: SearchHit[],
  opts?: { maxBullets?: number; computationalAnswer?: string }
): ExtractiveSummary {
  const maxBullets = opts?.maxBullets ?? 6;
  const ranked = [...hits].sort(
    (a, b) => relevanceScore(b, query) - relevanceScore(a, query)
  );
  const bulletPoints: string[] = [];
  for (const h of ranked) {
    const line = (h.snippet || h.title || "").replace(/\s+/g, " ").trim();
    if (!line) continue;
    const point = line.length > 220 ? `${line.slice(0, 217)}…` : line;
    if (!bulletPoints.includes(point)) bulletPoints.push(point);
    if (bulletPoints.length >= maxBullets) break;
  }
  if (opts?.computationalAnswer) {
    bulletPoints.unshift(`Computed: ${opts.computationalAnswer.slice(0, 280)}`);
  }
  return {
    mode: "extractive",
    query,
    bulletPoints,
    topSources: ranked.slice(0, 8).map((h) => ({
      title: h.title || h.url,
      url: h.url,
      engine: h.engine,
    })),
    answerSnippet: opts?.computationalAnswer,
    note:
      hits.length === 0
        ? "No hits to summarize. Configure search API keys or refine the query."
        : `Extractive summary from ${hits.length} hit(s). No model call.`,
  };
}

/**
 * Build a grounded prompt for abstractive summary.
 * Instructs model to use only provided sources.
 */
export function buildSummarizationPrompt(
  query: string,
  hits: SearchHit[],
  maxSources = 12
): string {
  const sources = hits.slice(0, maxSources).map((h, i) => {
    return `[${i + 1}] ${h.title}\nURL: ${h.url}\nSnippet: ${h.snippet || "(none)"}`;
  });
  return [
    "Summarize the following web search results for the user query.",
    "Rules:",
    "- Only use information present in the sources below.",
    "- Do not invent facts, URLs, or citations.",
    "- If sources conflict, note the disagreement.",
    "- If evidence is weak, say so.",
    "- End with a short bullet list of key points.",
    "",
    `Query: ${query}`,
    "",
    "Sources:",
    sources.join("\n\n") || "(no sources)",
  ].join("\n");
}

/**
 * Abstractive summary via OpenAI-compatible chat when OPENROUTER_API_KEY (or similar) is set.
 * Falls back to extractive on any failure.
 */
export async function summarizeSearchResults(
  query: string,
  hits: SearchHit[],
  opts?: {
    preferAbstractive?: boolean;
    model?: string;
    computationalAnswer?: string;
  }
): Promise<SearchSummary> {
  const extractive = summarizeSearchExtractive(query, hits, {
    computationalAnswer: opts?.computationalAnswer,
  });

  if (!opts?.preferAbstractive || hits.length === 0) {
    return extractive;
  }

  const apiKey =
    process.env.OPENROUTER_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.XAI_API_KEY;
  if (!apiKey) {
    return {
      ...extractive,
      mode: "extractive_fallback",
      summary: extractive.bulletPoints.join(" "),
      note: "Abstractive summary skipped — no LLM API key. Extractive used.",
    };
  }

  const baseUrl =
    process.env.OPENROUTER_API_KEY
      ? "https://openrouter.ai/api/v1"
      : process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const model =
    opts?.model ||
    process.env.SEARCH_SUMMARY_MODEL ||
    (process.env.OPENROUTER_API_KEY
      ? "openai/gpt-4o-mini"
      : "gpt-4o-mini");

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...(process.env.OPENROUTER_API_KEY
          ? {
              "HTTP-Referer": "https://github.com/kyleel2249/superior-ai",
              "X-Title": "SUPERIOR AI Search Summarizer",
            }
          : {}),
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You are a careful research summarizer. Use only provided sources. Never invent citations.",
          },
          {
            role: "user",
            content: buildSummarizationPrompt(query, hits),
          },
        ],
      }),
    });
    if (!res.ok) {
      return {
        ...extractive,
        mode: "extractive_fallback",
        summary: extractive.bulletPoints.join(" "),
        note: `Abstractive failed HTTP ${res.status}; extractive used.`,
      };
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim() || "";
    if (!text) {
      return {
        ...extractive,
        mode: "extractive_fallback",
        summary: extractive.bulletPoints.join(" "),
        note: "Empty model response; extractive used.",
      };
    }
    return {
      mode: "abstractive",
      query,
      summary: text,
      bulletPoints: extractive.bulletPoints,
      topSources: extractive.topSources,
      modelId: model,
      note: `Abstractive summary via ${model}. Grounded on ${hits.length} retrieved hit(s).`,
    };
  } catch (err) {
    return {
      ...extractive,
      mode: "extractive_fallback",
      summary: extractive.bulletPoints.join(" "),
      note: `Abstractive error: ${err instanceof Error ? err.message : String(err)}. Extractive used.`,
    };
  }
}
