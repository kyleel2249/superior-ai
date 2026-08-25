/**
 * Auto research gather — multi-engine search + structured brief skeleton.
 * Citations only from returned hits; never invents URLs.
 */

import {
  searchAllEngines,
  multiEngineSearch,
  type SearchHit,
} from "@superior-ai/tools";

export interface ResearchBrief {
  query: string;
  summary: string;
  sources: SearchHit[];
  engineSummary: string;
  gaps: string[];
  nextSteps: string[];
  at: string;
}

export async function autoGatherResearch(
  query: string,
  opts?: { allEngines?: boolean }
): Promise<ResearchBrief> {
  const data = opts?.allEngines === false
    ? await multiEngineSearch(query)
    : await searchAllEngines(query);

  const sources = ("merged" in data ? data.merged : []) as SearchHit[];
  const engineSummary =
    "summary" in data
      ? String(data.summary)
      : `Merged ${sources.length} unique hits from configured engines.`;

  const gaps: string[] = [];
  if (sources.length === 0) {
    gaps.push("No live hits — configure search API keys (Serper, Bing, Brave, …)");
  }
  if (sources.length > 0 && sources.length < 3) {
    gaps.push("Sparse results — try alternate query or enable more engines");
  }

  const summary =
    sources.length === 0
      ? `No verified web sources retrieved for “${query}”.`
      : `Retrieved ${sources.length} unique source(s) for “${query}”. Top: ${sources
          .slice(0, 3)
          .map((s) => s.title || s.url)
          .join("; ")}.`;

  return {
    query,
    summary,
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
