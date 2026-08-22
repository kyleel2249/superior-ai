import { NextRequest, NextResponse } from "next/server";
import { createOrganization, createInvite, acceptInvite, getOrganization, listMembers, getInvite, getSession } from "@superior-ai/auth";

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get("id");
  const inviteToken = req.nextUrl.searchParams.get("invite");
  if (inviteToken) {
    const inv = getInvite(inviteToken);
    if (!inv) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ email: inv.email, role: inv.role, status: inv.status, organizationId: inv.organizationId, expiresAt: inv.expiresAt });
  }
  if (orgId) {
    const org = getOrganization(orgId);
    if (!org) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ organization: org, members: listMembers(orgId) });
  }
  return NextResponse.json({ error: "id or invite query required" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session = getSession(req.headers.get("authorization"));
    if (body.action === "create") {
      const name = String(body.name ?? "").trim();
      if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
      const owner = session?.user ?? { id: body.userId ?? "user_anonymous", email: body.email ?? "owner@example.com" };
      const org = createOrganization(name, { userId: owner.id, email: owner.email });
      return NextResponse.json(org, { status: 201 });
    }
    if (body.action === "invite") {
      if (!body.organizationId || !body.email) return NextResponse.json({ error: "organizationId and email required" }, { status: 400 });
      const invite = createInvite({ organizationId: body.organizationId, email: body.email, role: body.role ?? "member" });
      return NextResponse.json({ id: invite.id, email: invite.email, role: invite.role, token: invite.token, expiresAt: invite.expiresAt }, { status: 201 });
    }
    if (body.action === "accept") {
      if (!body.token) return NextResponse.json({ error: "token required" }, { status: 400 });
      const user = session?.user;
      if (!user) return NextResponse.json({ error: "authentication required" }, { status: 401 });
      const result = acceptInvite(body.token, { userId: user.id, email: user.email });
      return NextResponse.json(result, { status: result.ok ? 200 : 400 });
    }
    return NextResponse.json({ error: "action must be create | invite | accept" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
