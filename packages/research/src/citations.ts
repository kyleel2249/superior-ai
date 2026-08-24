/**
 * Citation engine — only cites provided sources; never invents URLs.
 */

export interface SourceRef {
  id: string;
  title: string;
  url: string;
  snippet?: string;
  engine?: string;
  accessedAt: string;
  reliability: "observed" | "estimated" | "unknown";
}

export interface Citation {
  sourceId: string;
  claim: string;
  quote?: string;
  url: string;
}

export function sourcesFromSearchHits(
  hits: Array<{ title: string; url: string; snippet?: string; engine?: string }>
): SourceRef[] {
  return hits
    .filter((h) => h.url && /^https?:\/\//i.test(h.url))
    .map((h, i) => ({
      id: `src_${i + 1}`,
      title: h.title || h.url,
      url: h.url,
      snippet: h.snippet,
      engine: h.engine,
      accessedAt: new Date().toISOString(),
      reliability: "observed" as const,
    }));
}

export function formatBibliography(sources: SourceRef[]): string {
  return sources
    .map((s, i) => `[${i + 1}] ${s.title} — ${s.url}${s.snippet ? ` (“${s.snippet.slice(0, 120)}…”)` : ""}`)
    .join("\n");
}

export function citeClaims(
  claims: string[],
  sources: SourceRef[]
): { citations: Citation[]; unsupported: string[] } {
  const citations: Citation[] = [];
  const unsupported: string[] = [];
  for (const claim of claims) {
    const terms = claim.toLowerCase().split(/\W+/).filter((t) => t.length > 3);
    let best: SourceRef | undefined;
    let bestScore = 0;
    for (const s of sources) {
      const blob = `${s.title} ${s.snippet ?? ""}`.toLowerCase();
      const score = terms.filter((t) => blob.includes(t)).length;
      if (score > bestScore) {
        bestScore = score;
        best = s;
      }
    }
    if (best && bestScore >= 2) {
      citations.push({
        sourceId: best.id,
        claim,
        quote: best.snippet?.slice(0, 200),
        url: best.url,
      });
    } else {
      unsupported.push(claim);
    }
  }
  return { citations, unsupported };
}
