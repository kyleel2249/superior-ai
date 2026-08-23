import { NextRequest, NextResponse } from "next/server";
import { planMasterLoop, competitiveMatrix } from "@superior-ai/intelligence";

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("matrix") === "1") {
    return NextResponse.json({ matrix: competitiveMatrix() });
  }
  return NextResponse.json({
    loopStages: planMasterLoop("example").stages.map((s) => s.stage),
    differentiator:
      "ONE MEMORY + MANY MODELS + SPECIALIST AGENTS + CREATIVE + SOFTWARE FACTORY + BUSINESS OS",
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const run = planMasterLoop(String(body.objective ?? body.query ?? "Grow the business"));
  return NextResponse.json(run, { status: 201 });
}
