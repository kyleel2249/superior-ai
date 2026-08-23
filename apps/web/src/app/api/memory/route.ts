import { NextRequest, NextResponse } from "next/server";
import {
  rememberDurable, forgetDurable, retrieveRelevantDurable, memoryBackendStatus,
  listMemory, memoryStats, type PersistentMemoryType,
} from "@superior-ai/memory";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const query = sp.get("query");
  if (query) {
    const result = await retrieveRelevantDurable({
      query,
      profileId: sp.get("profileId") ?? undefined,
      organizationId: sp.get("organizationId") ?? undefined,
      projectId: sp.get("projectId") ?? undefined,
      limit: sp.get("limit") ? Number(sp.get("limit")) : undefined,
    });
    return NextResponse.json(result);
  }
  return NextResponse.json({
    backend: await memoryBackendStatus(),
    stats: memoryStats(),
    records: listMemory({
      type: (sp.get("type") as PersistentMemoryType) ?? undefined,
      profileId: sp.get("profileId") ?? undefined,
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action === "forget") {
      const result = await forgetDurable({ id: body.id, key: body.key, contentContains: body.contentContains, profileId: body.profileId });
      return NextResponse.json(result);
    }
    if (!body.type || !body.content) {
      return NextResponse.json({ error: "type and content required" }, { status: 400 });
    }
    const record = await rememberDurable({
      type: body.type,
      content: String(body.content),
      key: body.key,
      importance: body.importance,
      projectId: body.projectId,
      customerId: body.customerId,
      organizationId: body.organizationId,
      profileId: body.profileId,
      tags: body.tags,
      metadata: body.metadata,
    });
    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
