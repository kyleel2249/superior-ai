import { NextRequest, NextResponse } from "next/server";
import {
  rememberDurable,
  forgetDurable,
  retrieveRelevantDurable,
  memoryBackendStatus,
  type PersistentMemoryType,
} from "@superior-ai/memory";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query") ?? "";
  const profileId = req.nextUrl.searchParams.get("profileId") ?? undefined;
  const organizationId = req.nextUrl.searchParams.get("organizationId") ?? undefined;
  const customerId = req.nextUrl.searchParams.get("customerId") ?? undefined;
  const projectId = req.nextUrl.searchParams.get("projectId") ?? undefined;
  const typesParam = req.nextUrl.searchParams.get("types");
  const limitParam = req.nextUrl.searchParams.get("limit");

  const result = await retrieveRelevantDurable({
    query,
    profileId,
    organizationId,
    customerId,
    projectId,
    types: typesParam ? (typesParam.split(",") as PersistentMemoryType[]) : undefined,
    limit: limitParam ? Number(limitParam) : undefined,
  });
  return NextResponse.json({ backend: result.backend, records: result.records, count: result.records.length });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action === "forget") {
      const result = await forgetDurable({
        id: body.id,
        key: body.key,
        contentContains: body.contentContains,
        profileId: body.profileId,
      });
      return NextResponse.json(result);
    }
    if (!body.type || !body.content) {
      return NextResponse.json({ error: "type and content are required" }, { status: 400 });
    }
    const record = await rememberDurable({
      type: body.type as PersistentMemoryType,
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

export async function DELETE() {
  return NextResponse.json({ backend: await memoryBackendStatus() });
}
