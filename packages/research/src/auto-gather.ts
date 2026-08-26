/**
 * Auto research gather — multi-engine search + summarization + brief.
 * Citations only from returned hits; never invents URLs.
 */

import {
  searchAllEngines,
  multiEngineSearch,
  summarizeSearchResults,
  type SearchHit,
  type SearchSummary,
} from "@superior-ai/tools";

export interface ResearchBrief {
  query: string;
  /** Short human-readable overview */
  summary: string;
  /** Extractive or abstractive AI summary */
  aiSummary?: SearchSummary;
  sources: SearchHit[];
  engineSummary: string;
  gaps: string[];
  nextSteps: string[];
  at: string;
}

export async function autoGatherResearch(
  query: string,
  opts?: {
    allEngines?: boolean;
    /** Prefer LLM abstractive summary when API key present */
    abstractive?: boolean;
  }
): Promise<ResearchBrief> {
  const data =
    opts?.allEngines === false
      ? await multiEngineSearch(query)
      : await searchAllEngines(query);

  const sources = (data.merged ?? []) as SearchHit[];
  const engineSummary =
    data.summary ??
    `Merged ${sources.length} unique hits from configured engines.`;

  const gaps: string[] = [];
  if (sources.length === 0) {
    gaps.push(
      "No live hits — configure search API keys (Serper, Bing, Brave, …)"
    );
  }
  if (sources.length > 0 && sources.length < 3) {
    gaps.push("Sparse results — try alternate query or enable more engines");
  }

  const aiSummary = await summarizeSearchResults(query, sources, {
    preferAbstractive: opts?.abstractive !== false,
  });

  const summary =
    aiSummary.mode === "abstractive"
      ? aiSummary.summary.slice(0, 800)
      : sources.length === 0
        ? `No verified web sources retrieved for “${query}”.`
        : `Retrieved ${sources.length} unique source(s). ${aiSummary.bulletPoints.slice(0, 2).join(" ")}`;

  return {
    query,
    summary,
    aiSummary,
    sources: sources.slice(0, 40),
    engineSummary,
    gaps,
    nextSteps: [
      "Validate top sources manually",
      "Extract evidence claims with citations",
      "Run contradiction check on high-stakes topics",
      "Synthesize only from retrieved sources",
    ],
    at: new Date().toISOString(),
  };
}
