import { NextRequest, NextResponse } from "next/server";
import { recordUsage, setBudget, budgetStatus, summarizeUsage, estimateTokenCost, type MeterType } from "@superior-ai/billing";

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get("organizationId") ?? undefined;
  return NextResponse.json({
    usage: summarizeUsage({ organizationId: orgId }),
    budget: orgId ? budgetStatus(orgId) : null,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action === "set_budget") {
      if (!body.organizationId || body.monthlyLimitUsd == null) {
        return NextResponse.json({ error: "organizationId and monthlyLimitUsd required" }, { status: 400 });
      }
      return NextResponse.json(setBudget({
        organizationId: body.organizationId,
        monthlyLimitUsd: Number(body.monthlyLimitUsd),
        alertThreshold: body.alertThreshold,
        hardStop: body.hardStop,
      }));
    }
    if (body.action === "record") {
      const result = recordUsage({
        organizationId: body.organizationId,
        userId: body.userId,
        meter: body.meter as MeterType,
        quantity: Number(body.quantity ?? 0),
        costUsd: body.costUsd,
        provider: body.provider,
        modelId: body.modelId,
      });
      if ("blocked" in result && result.blocked) return NextResponse.json(result, { status: 402 });
      return NextResponse.json(result, { status: 201 });
    }
    if (body.action === "estimate") {
      return NextResponse.json({
        estimatedCostUsd: estimateTokenCost(Number(body.inputTokens ?? 0), Number(body.outputTokens ?? 0), body.modelId),
        note: "Estimate only — not invoice-grade",
      });
    }
    return NextResponse.json({ error: "action must be set_budget | record | estimate" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
