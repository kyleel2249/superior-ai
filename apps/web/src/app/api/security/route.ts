import { NextRequest, NextResponse } from "next/server";
import {
  dataClassificationGuide,
  privacyRequestTypes,
  openPrivacyRequest,
  listPrivacyRequests,
  soc2ControlTemplates,
  evidencePackChecklist,
  securityHeadersRecommended,
  listProcessingActivities,
  registerProcessingActivity,
  openDsar,
  listDsars,
  advanceDsar,
  erasurePlan,
  consentRecordTemplate,
} from "@superior-ai/security";
import { audit, listAuditEvents } from "@superior-ai/audit";
import { listPoliciesForRole, EXTENDED_ROLE_PERMS, type Role } from "@superior-ai/auth";

export async function GET(req: NextRequest) {
  const view = req.nextUrl.searchParams.get("view");
  if (view === "classification") return NextResponse.json({ rules: dataClassificationGuide() });
  if (view === "soc2") return NextResponse.json({ controls: soc2ControlTemplates(), checklist: evidencePackChecklist() });
  if (view === "headers") return NextResponse.json({ headers: securityHeadersRecommended() });
  if (view === "privacy") return NextResponse.json({ requests: listPrivacyRequests(), types: privacyRequestTypes() });
  if (view === "audit") return NextResponse.json({ events: listAuditEvents({ limit: 100 }) });
  if (view === "gdpr") {
    return NextResponse.json({
      processingActivities: listProcessingActivities(),
      dsars: listDsars(),
      consentTemplate: consentRecordTemplate(),
    });
  }
  if (view === "rbac") {
    const role = (req.nextUrl.searchParams.get("role") ?? "member") as Role;
    return NextResponse.json({
      role,
      permissions: EXTENDED_ROLE_PERMS[role] ?? [],
      policies: listPoliciesForRole(role),
      allRoles: Object.keys(EXTENDED_ROLE_PERMS),
    });
  }
  return NextResponse.json({
    views: ["classification", "soc2", "headers", "privacy", "audit", "gdpr", "rbac"],
    note: "Templates and operational helpers — not legal advice or SOC2 certification.",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action ?? "");

    if (action === "privacy_request") {
      const r = openPrivacyRequest({
        type: String(body.type ?? "access"),
        subjectRef: String(body.subjectRef ?? "unknown"),
        note: body.note,
      });
      await audit({
        action: "data.export",
        outcome: "success",
        resourceType: "privacy_request",
        resourceId: r.id,
        meta: { type: r.type },
      }).catch(() => undefined);
      return NextResponse.json(r, { status: 201 });
    }

    if (action === "dsar") {
      const c = openDsar({
        subjectRef: String(body.subjectRef ?? "unknown"),
        type: body.type ?? "access",
        note: body.note,
      });
      return NextResponse.json(c, { status: 201 });
    }

    if (action === "dsar_advance") {
      const c = advanceDsar(String(body.id), body.status, body.note);
      if (!c) return NextResponse.json({ error: "not found" }, { status: 404 });
      return NextResponse.json(c);
    }

    if (action === "erasure_plan") {
      return NextResponse.json(erasurePlan(String(body.subjectRef ?? "unknown")));
    }

    if (action === "register_processing") {
      return NextResponse.json(registerProcessingActivity(body.activity ?? body), { status: 201 });
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
