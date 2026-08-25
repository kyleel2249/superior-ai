import { NextRequest, NextResponse } from "next/server";
import {
  runSelfTests,
  listHealActions,
  applyHealAction,
  autoHealFromReport,
  listHealLog,
  platformPulse,
} from "@superior-ai/observability";

export async function GET(req: NextRequest) {
  const view = req.nextUrl.searchParams.get("view");
  if (view === "actions") return NextResponse.json({ actions: listHealActions() });
  if (view === "log") return NextResponse.json({ log: listHealLog() });
  if (view === "pulse") return NextResponse.json(platformPulse());
  return NextResponse.json({
    actions: ["run", "heal", "auto_heal"],
    views: ["actions", "log", "pulse"],
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "run");

    if (action === "run") {
      const report = runSelfTests();
      return NextResponse.json(report);
    }
    if (action === "heal") {
      const result = applyHealAction(String(body.actionId ?? ""), body.approved === true);
      return NextResponse.json(result);
    }
    if (action === "auto_heal") {
      const report = runSelfTests();
      const applied = autoHealFromReport(report);
      return NextResponse.json({ report, applied });
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
