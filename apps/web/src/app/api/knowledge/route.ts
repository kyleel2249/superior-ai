import { NextRequest, NextResponse } from "next/server";
import { ingestDocument, retrieve, buildRagContext } from "@superior-ai/memory";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action === "retrieve") {
      const query = String(body.query ?? "");
      const [chunks, context] = await Promise.all([retrieve(query, body.limit ?? 6), buildRagContext(query)]);
      return NextResponse.json({ chunks, context });
    }
    const title = String(body.title ?? "Untitled");
    const content = String(body.content ?? "");
    if (!content) return NextResponse.json({ error: "content required" }, { status: 400 });
    const chunks = await ingestDocument({ title, content, source: body.source, layer: body.layer ?? "knowledge" });
    return NextResponse.json({ ingested: chunks.length, ids: chunks.map((c) => c.id) }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
