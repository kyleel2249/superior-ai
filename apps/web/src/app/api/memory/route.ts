import { NextRequest, NextResponse } from "next/server";
import {
  rememberDurable,
  forgetDurable,
  retrieveRelevantDurable,
  listMemory,
  memoryStats,
  formatMemoryForPrompt,
  updateMemory,
  hybridRetrieve,
  ragStatus,
  detectMemoryConflicts,
  preferCanonical,
  upsertEntity,
  linkEntities,
  neighbors,
  graphSnapshot,
  buildMemoryContext,
  type PersistentMemoryType,
} from "@superior-ai/memory";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  const profileId = req.nextUrl.searchParams.get("profileId") ?? undefined;
  const projectId = req.nextUrl.searchParams.get("projectId") ?? undefined;

  if (q) {
    const { records, backend } = await retrieveRelevantDurable({
      query: q,
      profileId,
      projectId,
      limit: Number(req.nextUrl.searchParams.get("limit") ?? 12),
    });
    return NextResponse.json({
      records,
      promptBlock: formatMemoryForPrompt(records),
      backend,
      conflicts: detectMemoryConflicts(records),
    });
  }

  return NextResponse.json({
    stats: memoryStats(),
    rag: ragStatus(),
    graph: graphSnapshot(),
    note: "POST actions: remember | forget | update | update_default | reject | retrieve | search | conflicts | context | graph_link",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const profileId = body.profileId as string | undefined;
    const action = String(body.action ?? "");

    if (action === "remember" || action === "update_default") {
      const rec = await rememberDurable({
        type: (body.type ?? "preference") as PersistentMemoryType,
        content: String(body.content ?? ""),
        key: body.key,
        importance: body.importance ?? (action === "update_default" ? 90 : 60),
        projectId: body.projectId,
        customerId: body.customerId,
        organizationId: body.organizationId,
        profileId,
        tags: body.tags,
        metadata: body.metadata,
      });
      // Optional graph entity
      if (body.entityKind && body.entityLabel) {
        upsertEntity({
          kind: body.entityKind,
          label: String(body.entityLabel),
          metadata: { memoryId: rec.id },
        });
      }
      return NextResponse.json(rec, { status: 201 });
    }

    if (action === "forget") {
      return NextResponse.json(
        await forgetDurable({
          id: body.id,
          key: body.key,
          contentContains: body.contentContains,
          profileId,
        })
      );
    }

    if (action === "update") {
      const rec = updateMemory(String(body.id || body.key), String(body.content ?? ""), {
        profileId,
      });
      if (body.key) {
        await rememberDurable({
          type: (body.type ?? "preference") as PersistentMemoryType,
          content: String(body.content ?? ""),
          key: body.key,
          profileId,
          importance: body.importance ?? 60,
        });
      }
      if (!rec) return NextResponse.json({ error: "not found" }, { status: 404 });
      return NextResponse.json(rec);
    }

    if (action === "reject") {
      const rec = await rememberDurable({
        type: "rejection",
        content: String(body.content ?? ""),
        importance: 85,
        profileId,
        tags: ["rejection"],
      });
      return NextResponse.json(rec, { status: 201 });
    }

    if (action === "retrieve" || action === "search") {
      const { records, backend } = await retrieveRelevantDurable({
        query: String(body.query ?? body.q ?? ""),
        types: body.types,
        projectId: body.projectId,
        customerId: body.customerId,
        profileId,
        limit: body.limit ?? 12,
      });
      let rag = null;
      try {
        rag = await hybridRetrieve(String(body.query ?? body.q ?? ""), {
          limit: body.limit ?? 6,
          minScore: body.minScore ?? 0.15,
        });
      } catch {
        rag = null;
      }
      return NextResponse.json({
        records,
        promptBlock: formatMemoryForPrompt(records),
        backend,
        rag,
        conflicts: detectMemoryConflicts(records),
      });
    }

    if (action === "conflicts") {
      const listed = listMemory({ profileId, activeOnly: true });
      const conflicts = detectMemoryConflicts(listed);
      return NextResponse.json({
        conflicts: conflicts.map((c) => ({
          reason: c.reason,
          a: { id: c.a.id, key: c.a.key, content: c.a.content.slice(0, 200) },
          b: { id: c.b.id, key: c.b.key, content: c.b.content.slice(0, 200) },
          preferred: preferCanonical(c.a, c.b).id,
        })),
      });
    }

    if (action === "context") {
      const ctx = await buildMemoryContext({
        query: String(body.query ?? body.message ?? ""),
        profileId,
        projectId: body.projectId,
        types: body.types,
        limit: body.limit ?? 8,
      });
      return NextResponse.json(ctx);
    }

    if (action === "graph_link") {
      const from = upsertEntity({
        kind: body.fromKind ?? "concept",
        label: String(body.fromLabel ?? body.from),
      });
      const to = upsertEntity({
        kind: body.toKind ?? "concept",
        label: String(body.toLabel ?? body.to),
      });
      const edge = linkEntities(from.id, to.id, String(body.relation ?? "related"));
      return NextResponse.json({ from, to, edge, neighbors: neighbors(from.id) });
    }

    if (action === "list") {
      return NextResponse.json({
        records: listMemory({
          profileId,
          type: body.type,
          activeOnly: body.activeOnly !== false,
        }),
      });
    }

    return NextResponse.json(
      {
        error:
          "action must be remember | forget | update | update_default | reject | retrieve | search | conflicts | context | graph_link | list",
      },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
