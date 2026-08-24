import { NextRequest, NextResponse } from "next/server";
import {
  runAsCompany,
  listCompanyDepartments,
  buildCompanyOrgChart,
  selectAgentsForGrowthTask,
  growthLoopPlan,
} from "@superior-ai/agents";

export async function GET() {
  const depts = listCompanyDepartments();
  return NextResponse.json({
    mode: "RUN_AS_COMPANY",
    departments: depts.map((d) => ({
      id: d.id,
      name: d.name,
      objectives: d.objectives,
      kpis: d.kpis,
      agentCount: d.agents.length,
      agents: d.agents.map((a) => a.displayName),
    })),
    orgChart: buildCompanyOrgChart(),
    note: "POST { objective, product?, audience?, region? } to run multi-department collaboration.",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action ?? "run");

    if (action === "org") {
      return NextResponse.json({ orgChart: buildCompanyOrgChart() });
    }

    if (action === "plan") {
      const objective = String(body.objective ?? body.message ?? "").trim();
      if (!objective) return NextResponse.json({ error: "objective required" }, { status: 400 });
      return NextResponse.json({
        agents: selectAgentsForGrowthTask(objective).map((a) => ({
          id: a.id,
          name: a.displayName,
          role: a.role,
        })),
        growthPlan: growthLoopPlan(objective),
      });
    }

    const objective = String(body.objective ?? body.message ?? "").trim();
    if (!objective) {
      return NextResponse.json({ error: "objective required" }, { status: 400 });
    }

    const result = await runAsCompany({
      objective,
      product: body.product,
      audience: body.audience,
      region: body.region,
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
