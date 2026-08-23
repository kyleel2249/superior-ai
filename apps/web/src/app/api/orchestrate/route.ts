import { NextRequest, NextResponse } from "next/server";
import { limitOrchestrate, withSpan } from "@superior-ai/observability";
import { runOrchestrator } from "@superior-ai/agents";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const objective = String(body.objective ?? body.message ?? "").trim();
    if (!objective) {
      return NextResponse.json({ error: "objective required" }, { status: 400 });
    }

    const result = await runOrchestrator({
      objective,
      mode: body.mode ?? "execute_safe",
      region: body.region,
      product: body.product,
      audience: body.audience,
      competitorUrls: body.competitorUrls,
      userId: body.userId,
      projectId: body.projectId,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[orchestrate]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
