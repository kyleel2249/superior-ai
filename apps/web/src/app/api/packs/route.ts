import { NextRequest, NextResponse } from "next/server";
import { listCatalog, getPack, installPack, uninstallPack, listInstalled, type PackCategory } from "@superior-ai/agents";
import { audit } from "@superior-ai/audit";
import { getSession, getSessionFromCookies } from "@superior-ai/auth";

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get("organizationId") ?? "org_dev";
  const category = req.nextUrl.searchParams.get("category") as PackCategory | null;
  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    const pack = getPack(id);
    if (!pack) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(pack);
  }
  return NextResponse.json({
    catalog: listCatalog(category ? { category } : undefined),
    installed: listInstalled(orgId),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session =
      getSession(req.headers.get("authorization")) ||
      getSessionFromCookies(req.headers.get("cookie"));
    const organizationId = body.organizationId ?? session?.user.organizationId ?? "org_dev";
    if (body.action === "install") {
      const result = installPack({ packId: body.packId, organizationId });
      if (result.ok) {
        audit({
          action: "admin.config",
          actorId: session?.user.id,
          organizationId,
          resourceType: "agent_pack",
          resourceId: body.packId,
          outcome: "success",
          meta: { action: "install" },
        });
      }
      return NextResponse.json(result, { status: result.ok ? 200 : 400 });
    }
    if (body.action === "uninstall") {
      const ok = uninstallPack(body.packId, organizationId);
      return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
    }
    return NextResponse.json({ error: "action must be install | uninstall" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
