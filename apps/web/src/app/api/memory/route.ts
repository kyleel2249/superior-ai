import { NextRequest, NextResponse } from "next/server";
import {
  rememberDurable,
  forgetDurable,
  retrieveRelevantDurable,
  memoryBackendStatus,
  updateMemory,
  listMemory,
  memoryStats,
  formatMemoryForPrompt,
  getRejections,
  remember,
} from "@superior-ai/memory";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  const profileId = req.nextUrl.searchParams.get("profileId") ?? undefined;
  const backend = await memoryBackendStatus();

  if (q) {
    const { records, backend: b } = await retrieveRelevantDurable({
      query: q,
      profileId,
      limit: 12,
    });
    return NextResponse.json({
      records,
      promptBlock: formatMemoryForPrompt(records),
      rejections: getRejections(profileId),
      backend: b,
    });
  }
  return NextResponse.json({
    stats: memoryStats(),
    recent: listMemory({ profileId, activeOnly: true }),
    rejections: getRejections(profileId),
    backend,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const profileId = body.profileId;

    if (body.action === "remember" || body.action === "update_default") {
      const rec = await rememberDurable({
        type: body.type ?? "preference",
        content: String(body.content ?? ""),
        key: body.key,
        importance: body.importance ?? (body.action === "update_default" ? 90 : 60),
        projectId: body.projectId,
        customerId: body.customerId,
        organizationId: body.organizationId,
        profileId,
        tags: body.tags,
        metadata: body.metadata,
      });
      return NextResponse.json(rec, { status: 201 });
    }

    if (body.action === "forget") {
      return NextResponse.json(
        await forgetDurable({
          id: body.id,
          key: body.key,
          contentContains: body.contentContains,
          profileId,
        })
      );
    }

    if (body.action === "update") {
      const rec = updateMemory(String(body.id || body.key), String(body.content ?? ""), {
        profileId,
      });
      // Also try durable remember with same key for postgres sync
      if (body.key) {
        await rememberDurable({
          type: body.type ?? "preference",
          content: String(body.content ?? ""),
          key: body.key,
          profileId,
          importance: body.importance ?? 60,
        });
      }
      if (!rec) return NextResponse.json({ error: "not found" }, { status: 404 });
      return NextResponse.json(rec);
    }

    if (body.action === "reject") {
      const rec = await rememberDurable({
        type: "rejection",
        content: String(body.content ?? ""),
        importance: 85,
        profileId,
        tags: ["rejection"],
      });
      return NextResponse.json(rec, { status: 201 });
    }

    if (body.action === "retrieve") {
      const { records, backend } = await retrieveRelevantDurable({
        query: String(body.query ?? ""),
        types: body.types,
        projectId: body.projectId,
        customerId: body.customerId,
        profileId,
        limit: body.limit ?? 12,
      });
      return NextResponse.json({
        records,
        promptBlock: formatMemoryForPrompt(records),
        backend,
      });
    }

    return NextResponse.json(
      { error: "action must be remember | forget | update | reject | retrieve | update_default" },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
