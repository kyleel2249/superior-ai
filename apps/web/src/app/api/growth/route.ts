import { NextRequest, NextResponse } from "next/server";
import {
  runGrowthLoop,
  growthOpportunities,
  proposeExperiments,
  GROWTH_STAGES,
} from "@superior-ai/marketing";

export async function GET() {
  return NextResponse.json({
    stages: GROWTH_STAGES,
    opportunities: growthOpportunities(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action === "experiments") {
      return NextResponse.json({ experiments: proposeExperiments(String(body.context ?? "growth")) });
    }
    return NextResponse.json(
      runGrowthLoop({
        objective: String(body.objective ?? "Grow revenue"),
        product: String(body.product ?? "Product"),
        audience: body.audience,
      })
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
