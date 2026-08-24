import { NextRequest, NextResponse } from "next/server";
import {
  listProfiles,
  getActiveProfile,
  setActiveProfile,
  createProfile,
  listProjects,
  createProject,
  updateProject,
  getProject,
  getPreferences,
  updatePreferences,
  type WorkspaceProfileKind,
} from "@superior-ai/workspace";
import { isFeatureEnabled } from "@superior-ai/core";

export async function GET(req: NextRequest) {
  const profileId = req.nextUrl.searchParams.get("profileId") ?? getActiveProfile().id;
  return NextResponse.json({
    profiles: listProfiles(),
    active: getActiveProfile(),
    projects: listProjects(profileId),
    preferences: getPreferences(profileId),
    unlimitedWorkspace: true,
    authRequired: false,
    billingUi: isFeatureEnabled("billingUi") && process.env.ENABLE_BILLING_UI === "1",
    note: "Local-first: Launch → Workspace → Use SUPERIOR AI. No mandatory sign-in.",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action ?? "");

    if (action === "activate") {
      const p = setActiveProfile(String(body.id));
      if (!p) return NextResponse.json({ error: "not found" }, { status: 404 });
      return NextResponse.json(p);
    }

    if (action === "create_profile") {
      const p = createProfile(
        String(body.name ?? "Profile"),
        (body.kind ?? "personal") as WorkspaceProfileKind
      );
      return NextResponse.json(p, { status: 201 });
    }

    // backward compatible
    if (action === "create" && !body.projectName) {
      const p = createProfile(
        String(body.name ?? "Profile"),
        (body.kind ?? "personal") as WorkspaceProfileKind
      );
      return NextResponse.json(p, { status: 201 });
    }

    if (action === "create_project") {
      const profileId = String(body.profileId ?? getActiveProfile().id);
      const project = createProject({
        name: String(body.name ?? body.projectName ?? "Untitled"),
        description: body.description,
        profileId,
      });
      return NextResponse.json(project, { status: 201 });
    }

    if (action === "update_project") {
      const project = updateProject(String(body.id), {
        name: body.name,
        description: body.description,
        status: body.status,
      });
      if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });
      return NextResponse.json(project);
    }

    if (action === "get_project") {
      const project = getProject(String(body.id));
      if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });
      return NextResponse.json(project);
    }

    if (action === "update_preferences") {
      const profileId = String(body.profileId ?? getActiveProfile().id);
      const prefs = updatePreferences(profileId, body.preferences ?? body);
      return NextResponse.json(prefs);
    }

    if (action === "get_preferences") {
      const profileId = String(body.profileId ?? getActiveProfile().id);
      return NextResponse.json(getPreferences(profileId));
    }

    return NextResponse.json(
      {
        error:
          "action must be activate | create_profile | create_project | update_project | update_preferences | get_preferences",
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
