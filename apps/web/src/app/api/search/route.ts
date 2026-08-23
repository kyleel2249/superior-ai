import { NextRequest, NextResponse } from "next/server";
import {
  liveSearch,
  searchWithEngine,
  multiEngineSearch,
  listSearchEngines,
  type SearchEngineId,
} from "@superior-ai/tools";

export async function GET() {
  return NextResponse.json({
    engines: listSearchEngines(),
    note: "POST { query, engine?, multi?, engines?, prefer? }. Never invents results.",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = String(body.query ?? "").trim();
    if (!query) {
      return NextResponse.json({ error: "query required" }, { status: 400 });
    }

    if (body.multi) {
      const data = await multiEngineSearch(
        query,
        Array.isArray(body.engines) ? (body.engines as SearchEngineId[]) : undefined
      );
      return NextResponse.json(data);
    }

    if (body.engine) {
      const data = await searchWithEngine(query, String(body.engine));
      return NextResponse.json(data);
    }

    const data = await liveSearch(query, {
      prefer: body.prefer,
      engines: body.engines,
    });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
