import { NextRequest, NextResponse } from "next/server";
import {
  listProfiles,
  getActiveProfile,
  setActiveProfile,
  createProfile,
  type WorkspaceProfileKind,
} from "@superior-ai/workspace";

export async function GET() {
  return NextResponse.json({
    profiles: listProfiles(),
    active: getActiveProfile(),
    unlimitedWorkspace: true,
    authRequired: false,
    note: "Local-first: no mandatory sign-in for single-user experience",
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.action === "activate") {
    const p = setActiveProfile(String(body.id));
    if (!p) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(p);
  }
  if (body.action === "create") {
    const p = createProfile(String(body.name ?? "Profile"), (body.kind ?? "personal") as WorkspaceProfileKind);
    return NextResponse.json(p, { status: 201 });
  }
  return NextResponse.json({ error: "action must be activate | create" }, { status: 400 });
}
