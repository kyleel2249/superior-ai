import { NextRequest, NextResponse } from "next/server";
import { audit, listAuditEvents, auditStats } from "@superior-ai/audit";
import { getSession, getSessionFromCookies } from "@superior-ai/auth";

export async function GET(req: NextRequest) {
  const session =
    getSession(req.headers.get("authorization")) ||
    getSessionFromCookies(req.headers.get("cookie"));
  if (process.env.NODE_ENV === "production" && !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sp = req.nextUrl.searchParams;
  return NextResponse.json({
    stats: auditStats(),
    events: listAuditEvents({
      organizationId: sp.get("organizationId") ?? session?.user.organizationId,
      actorId: sp.get("actorId") ?? undefined,
      action: sp.get("action") ?? undefined,
      limit: Number(sp.get("limit") ?? 50),
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session =
      getSession(req.headers.get("authorization")) ||
      getSessionFromCookies(req.headers.get("cookie"));
    const event = audit({
      action: body.action ?? "admin.config",
      actorId: session?.user.id ?? body.actorId,
      actorEmail: session?.user.email ?? body.actorEmail,
      organizationId: session?.user.organizationId ?? body.organizationId,
      resourceType: body.resourceType,
      resourceId: body.resourceId,
      outcome: body.outcome ?? "success",
      ip: req.headers.get("x-forwarded-for")?.split(",")[0] ?? undefined,
      meta: body.meta,
      requestId: req.headers.get("x-request-id") ?? undefined,
    });
    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
