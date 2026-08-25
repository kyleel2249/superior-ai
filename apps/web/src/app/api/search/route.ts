import { NextRequest, NextResponse } from "next/server";
import {
  listSearchEngines,
  liveSearch,
  multiEngineSearch,
  searchAllEngines,
  searchWithEngine,
  type SearchEngineId,
} from "@superior-ai/tools";

/**
 * Unified search API — auto fan-out to engines when multi/all requested.
 * Does not invent results; engines without keys return CONFIGURATION_REQUIRED.
 */
export async function GET(req: NextRequest) {
  const view = req.nextUrl.searchParams.get("view");
  if (view === "engines" || !req.nextUrl.searchParams.get("q")) {
    return NextResponse.json({
      engines: listSearchEngines(),
      note: "Set provider keys in .env for live SERP. DuckDuckGo may work keyless. Never invents sources.",
    });
  }
  const q = String(req.nextUrl.searchParams.get("q") ?? "").trim();
  const mode = req.nextUrl.searchParams.get("mode") ?? "auto";
  const engine = req.nextUrl.searchParams.get("engine") as SearchEngineId | null;
  try {
    if (mode === "all") {
      return NextResponse.json(await searchAllEngines(q));
    }
    if (mode === "multi") {
      return NextResponse.json(await multiEngineSearch(q));
    }
    if (engine) {
      return NextResponse.json(await searchWithEngine(q, engine));
    }
    return NextResponse.json(await liveSearch(q));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const q = String(body.query ?? body.q ?? "").trim();
    if (!q) return NextResponse.json({ error: "query required" }, { status: 400 });
    const mode = String(body.mode ?? "all");
    if (mode === "all") return NextResponse.json(await searchAllEngines(q));
    if (mode === "multi") return NextResponse.json(await multiEngineSearch(q, body.engines));
    if (body.engine) return NextResponse.json(await searchWithEngine(q, body.engine));
    return NextResponse.json(await liveSearch(q, { prefer: body.prefer }));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
