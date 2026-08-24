import { NextRequest, NextResponse } from "next/server";
import {
  listKpis,
  evaluateKpis,
  buildExecutiveBriefing,
  createDecision,
  listDecisions,
  setDecisionStatus,
  funnelAnalyticsTemplate,
  planMasterLoop,
  type ObservedMetric,
} from "@superior-ai/intelligence";

export async function GET(req: NextRequest) {
  const view = req.nextUrl.searchParams.get("view");
  if (view === "kpis") return NextResponse.json({ kpis: listKpis() });
  if (view === "decisions") return NextResponse.json({ decisions: listDecisions() });
  if (view === "funnel") return NextResponse.json({ funnel: funnelAnalyticsTemplate() });
  return NextResponse.json({
    actions: ["briefing", "evaluate", "decision", "decision_status", "master_loop"],
    note: "Metrics must be supplied as observed values — never invented.",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action ?? "briefing");

    const observed: ObservedMetric[] = Array.isArray(body.observed)
      ? body.observed.map((o: Record<string, unknown>) => ({
          kpiId: String(o.kpiId),
          value: Number(o.value),
          period: String(o.period ?? "current"),
          source: String(o.source ?? "user_supplied"),
          observedAt: String(o.observedAt ?? new Date().toISOString()),
        }))
      : [];

    if (action === "evaluate") {
      return NextResponse.json({ statuses: evaluateKpis(observed, body.thresholds) });
    }
    if (action === "briefing") {
      return NextResponse.json(
        buildExecutiveBriefing({
          title: body.title,
          period: body.period,
          observed,
          highlights: body.highlights,
          risks: body.risks,
          decisionsNeeded: body.decisionsNeeded,
        })
      );
    }
    if (action === "decision") {
      if (!body.question || !Array.isArray(body.options)) {
        return NextResponse.json({ error: "question and options required" }, { status: 400 });
      }
      return NextResponse.json(
        createDecision({
          question: String(body.question),
          options: body.options,
          recommendation: String(body.recommendation ?? ""),
          assumptions: body.assumptions,
          evidenceRefs: body.evidenceRefs,
          metricsUsed: body.metricsUsed,
          owner: body.owner,
        }),
        { status: 201 }
      );
    }
    if (action === "decision_status") {
      const d = setDecisionStatus(String(body.id), body.status);
      if (!d) return NextResponse.json({ error: "not found" }, { status: 404 });
      return NextResponse.json(d);
    }
    if (action === "master_loop") {
      return NextResponse.json(planMasterLoop(String(body.objective ?? "Grow the business")));
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
