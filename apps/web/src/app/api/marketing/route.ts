import { NextRequest, NextResponse } from "next/server";
import {
  generateWeekCalendar,
  contentIdeas,
  proposeExperiments,
  growthOpportunities,
  createNurtureWorkflow,
  createLaunchWorkflow,
  listWorkflows,
  approveWorkflowStep,
  advanceWorkflow,
  emailSequenceTemplates,
  runGrowthLoop,
} from "@superior-ai/marketing";

export async function GET(req: NextRequest) {
  const view = req.nextUrl.searchParams.get("view");
  if (view === "workflows") return NextResponse.json({ workflows: listWorkflows() });
  if (view === "opportunities") return NextResponse.json({ opportunities: growthOpportunities() });
  return NextResponse.json({
    actions: ["calendar", "ideas", "experiments", "nurture", "launch", "approve_step", "advance", "email_seq", "growth"],
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action ?? "calendar");
    const product = String(body.product ?? "Product");

    if (action === "calendar") {
      return NextResponse.json({ items: generateWeekCalendar(product, body.platforms) });
    }
    if (action === "ideas") {
      return NextResponse.json({ ideas: contentIdeas(product, Number(body.count ?? 10)) });
    }
    if (action === "experiments") {
      return NextResponse.json({ experiments: proposeExperiments(String(body.context ?? product)) });
    }
    if (action === "nurture") {
      return NextResponse.json(
        createNurtureWorkflow(product, String(body.audience ?? "customers")),
        { status: 201 }
      );
    }
    if (action === "launch") {
      return NextResponse.json(createLaunchWorkflow(product), { status: 201 });
    }
    if (action === "approve_step") {
      const wf = approveWorkflowStep(String(body.workflowId), String(body.stepId));
      if (!wf) return NextResponse.json({ error: "not found" }, { status: 404 });
      return NextResponse.json(wf);
    }
    if (action === "advance") {
      const wf = advanceWorkflow(String(body.workflowId));
      if (!wf) return NextResponse.json({ error: "not found" }, { status: 404 });
      return NextResponse.json(wf);
    }
    if (action === "email_seq") {
      return NextResponse.json({ sequence: emailSequenceTemplates(product) });
    }
    if (action === "growth") {
      return NextResponse.json(
        runGrowthLoop({
          objective: String(body.objective ?? `Grow ${product}`),
          product,
          audience: body.audience,
        })
      );
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
