/**
 * Deep research pipeline: search → sources → optional URL read → evidence → contradictions → citations.
 * Never invents sources.
 */

import { liveSearch, multiEngineSearch } from "@superior-ai/tools";
import { sourcesFromSearchHits, formatBibliography, citeClaims, type SourceRef } from "./citations";
import { buildEvidence, evidenceReport } from "./evidence";
import { detectSourceContradictions } from "./contradictions";
import { analyzeUrls } from "./url-analyzer";

export interface DeepResearchInput {
  query: string;
  urls?: string[];
  multiEngine?: boolean;
  fetchTop?: number;
  claims?: string[];
}

export interface DeepResearchResult {
  query: string;
  searchStatus: string;
  engine?: string;
  sources: SourceRef[];
  bibliography: string;
  urlAnalyses: Awaited<ReturnType<typeof analyzeUrls>>;
  contradictions: ReturnType<typeof detectSourceContradictions>;
  evidence: ReturnType<typeof buildEvidence>;
  evidenceReport: string;
  citations?: ReturnType<typeof citeClaims>;
  note: string;
}

export async function runDeepResearch(input: DeepResearchInput): Promise<DeepResearchResult> {
  const query = input.query.trim();
  let searchStatus = "skipped";
  let engine: string | undefined;
  let hits: Array<{ title: string; url: string; snippet?: string; engine?: string }> = [];

  if (query) {
    if (input.multiEngine) {
      const multi = await multiEngineSearch(query);
      hits = multi.results ?? [];
      searchStatus = multi.status ?? "OK";
      engine = "multi";
    } else {
      const res = await liveSearch(query);
      hits = res.results ?? [];
      searchStatus = res.status;
      engine = res.engine;
    }
  }

  const sources = sourcesFromSearchHits(hits);
  const fetchCount = input.fetchTop ?? 0;
  const urlsToFetch = [
    ...(input.urls ?? []),
    ...sources.slice(0, fetchCount).map((s) => s.url),
  ].filter((u, i, arr) => arr.indexOf(u) === i);

  const urlAnalyses = urlsToFetch.length ? await analyzeUrls(urlsToFetch) : [];

  // Enrich snippets from fetched pages when search snippet empty
  for (const a of urlAnalyses) {
    if (!a.ok || !a.excerpt) continue;
    const src = sources.find((s) => s.url === a.url);
    if (src && !src.snippet) src.snippet = a.excerpt.slice(0, 280);
  }

  const contradictions = detectSourceContradictions(
    sources.map((s) => ({ title: s.title, url: s.url, snippet: s.snippet }))
  );

  const statements = sources.slice(0, 8).map((s) => ({
    text: s.snippet || s.title,
    sourceIds: [s.id],
  }));
  const evidence = buildEvidence(statements, sources);

  let citations;
  if (input.claims?.length) {
    citations = citeClaims(input.claims, sources);
  }

  return {
    query,
    searchStatus,
    engine,
    sources,
    bibliography: formatBibliography(sources),
    urlAnalyses,
    contradictions,
    evidence,
    evidenceReport: evidenceReport(evidence),
    citations,
    note:
      sources.length === 0
        ? "No sources returned. Configure search API keys or provide URLs. Never invent citations."
        : "Sources are observed from search/fetch only. Unsupported claims must not be stated as fact.",
  };
}
