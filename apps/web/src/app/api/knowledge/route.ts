import { NextRequest, NextResponse } from "next/server";
import {
  ingestDocument,
  retrieve,
  buildRagContext,
  indexDocuments,
  vectorSearch,
  vectorStoreStats,
  hybridRetrieve,
  ragStatus,
} from "@superior-ai/memory";
import { enqueue } from "@superior-ai/queue";

export async function GET() {
  return NextResponse.json({ stats: vectorStoreStats(), rag: ragStatus() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === "retrieve") {
      const query = String(body.query ?? "");
      if (body.hybrid || body.vector) {
        const { hits, stats } = await hybridRetrieve(query, { limit: body.limit ?? 6 });
        return NextResponse.json({ hits, stats, mode: "hybrid" });
      }
      return NextResponse.json({
        chunks: retrieve(query, body.limit ?? 6),
        context: buildRagContext(query),
        mode: "lexical",
      });
    }

    if (body.action === "index_async") {
      const job = enqueue({
        type: "embed_index",
        payload: { documents: body.documents ?? [] },
        lane: "background",
        priority: 40,
      });
      return NextResponse.json({ jobId: job.id, status: job.status }, { status: 202 });
    }

    if (body.action === "index") {
      const docs = body.documents ?? [
        { title: String(body.title ?? "Untitled"), content: String(body.content ?? ""), source: body.source },
      ];
      const result = await indexDocuments(docs.filter((d: { content?: string }) => d.content));
      return NextResponse.json(result, { status: 201 });
    }

    // default ingest (lexical chunks)
    const title = String(body.title ?? "Untitled");
    const content = String(body.content ?? "");
    if (!content) return NextResponse.json({ error: "content required" }, { status: 400 });
    const chunks = ingestDocument({ title, content, source: body.source, layer: body.layer ?? "knowledge" });
    return NextResponse.json({ ingested: chunks.length, ids: chunks.map((c) => c.id) }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
