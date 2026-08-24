import { NextRequest, NextResponse } from "next/server";
import {
  runDeepResearch,
  analyzeUrls,
  sourcesFromSearchHits,
  formatBibliography,
  citeClaims,
  detectSourceContradictions,
  buildEvidence,
} from "@superior-ai/research";
import { liveSearch } from "@superior-ai/tools";

export async function GET() {
  return NextResponse.json({
    actions: ["deep", "urls", "search_cite", "contradictions"],
    note: "Never invents sources. Provide query and/or urls.",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action ?? "deep");

    if (action === "urls") {
      const urls = Array.isArray(body.urls) ? body.urls.map(String) : [];
      if (!urls.length) {
        return NextResponse.json({ error: "urls array required" }, { status: 400 });
      }
      const analyses = await analyzeUrls(urls, { extractLinks: Boolean(body.extractLinks) });
      return NextResponse.json({ analyses });
    }

    if (action === "search_cite") {
      const query = String(body.query ?? "").trim();
      if (!query) return NextResponse.json({ error: "query required" }, { status: 400 });
      const search = await liveSearch(query);
      const sources = sourcesFromSearchHits(search.results ?? []);
      const claims = Array.isArray(body.claims) ? body.claims.map(String) : [];
      const cited = claims.length ? citeClaims(claims, sources) : undefined;
      return NextResponse.json({
        search: { status: search.status, engine: search.engine, count: sources.length },
        sources,
        bibliography: formatBibliography(sources),
        citations: cited,
        contradictions: detectSourceContradictions(
          sources.map((s) => ({ title: s.title, url: s.url, snippet: s.snippet }))
        ),
      });
    }

    if (action === "contradictions") {
      const sources = Array.isArray(body.sources) ? body.sources : [];
      return NextResponse.json({
        contradictions: detectSourceContradictions(sources),
      });
    }

    // deep research default
    const query = String(body.query ?? body.message ?? "").trim();
    const urls = Array.isArray(body.urls) ? body.urls.map(String) : undefined;
    if (!query && !urls?.length) {
      return NextResponse.json({ error: "query or urls required" }, { status: 400 });
    }

    const result = await runDeepResearch({
      query: query || "url-only research",
      urls,
      multiEngine: Boolean(body.multiEngine),
      fetchTop: Number(body.fetchTop ?? 0),
      claims: Array.isArray(body.claims) ? body.claims.map(String) : undefined,
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
