import { NextRequest, NextResponse } from "next/server";
import {
  autoProbeFromEnv,
  listComponents,
  overallStatus,
  listIncidents,
  setComponentStatus,
  createIncident,
  updateIncident,
  type ComponentStatus,
} from "@superior-ai/observability";
import { getSession, getSessionFromCookies, hasPermission } from "@superior-ai/auth";

export async function GET() {
  autoProbeFromEnv();
  const components = listComponents();
  const overall = overallStatus();
  return NextResponse.json({
    overall,
    components,
    incidents: listIncidents(10),
    checkedAt: new Date().toISOString(),
    product: "SUPERIOR AI",
  });
}

export async function POST(req: NextRequest) {
  const session =
    getSession(req.headers.get("authorization")) ||
    getSessionFromCookies(req.headers.get("cookie"));
  if (!session || !hasPermission(session.user, "manage_providers")) {
    return NextResponse.json({ error: "Admin required" }, { status: 403 });
  }

  const body = await req.json();
  if (body.action === "set_component") {
    const row = setComponentStatus(
      String(body.id),
      body.status as ComponentStatus,
      body.description
    );
    return NextResponse.json(row);
  }
  if (body.action === "create_incident") {
    const inc = createIncident({
      title: String(body.title ?? "Incident"),
      body: String(body.body ?? ""),
      impact: body.impact,
    });
    return NextResponse.json(inc, { status: 201 });
  }
  if (body.action === "update_incident") {
    const inc = updateIncident(String(body.id), body.patch ?? body);
    if (!inc) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(inc);
  }
  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
