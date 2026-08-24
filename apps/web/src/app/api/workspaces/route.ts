import { NextRequest, NextResponse } from "next/server";
import {
  createWorkspace,
  listWorkspaces,
  renameWorkspace,
  deleteWorkspace,
  createProject,
  listProjects,
  renameProject,
  deleteProject,
  getPreferences,
  setPreferences,
} from "@superior-ai/workspace";

// Deliberately no getSession()/hasPermission() gate here — Phase 2 requires
// workspace/project creation to work with zero sign-in.

export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  if (workspaceId) {
    return NextResponse.json({
      projects: listProjects(workspaceId),
      preferences: getPreferences(workspaceId),
    });
  }
  return NextResponse.json({ workspaces: listWorkspaces() });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = body.action ?? "create_workspace";

  try {
    switch (action) {
      case "create_workspace":
        return NextResponse.json(createWorkspace(body.name, body.profile));
      case "rename_workspace": {
        const ws = renameWorkspace(body.workspaceId, body.name);
        if (!ws) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
        return NextResponse.json(ws);
      }
      case "delete_workspace":
        deleteWorkspace(body.workspaceId);
        return NextResponse.json({ deleted: true });
      case "create_project":
        return NextResponse.json(createProject(body.workspaceId, body.name, body.description));
      case "rename_project": {
        const proj = renameProject(body.projectId, body.name);
        if (!proj) return NextResponse.json({ error: "Project not found" }, { status: 404 });
        return NextResponse.json(proj);
      }
      case "delete_project":
        deleteProject(body.projectId);
        return NextResponse.json({ deleted: true });
      case "set_preferences":
        return NextResponse.json(setPreferences(body.workspaceId, body.preferences ?? {}));
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 400 });
  }
}
