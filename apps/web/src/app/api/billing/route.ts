import { NextRequest, NextResponse } from "next/server";
import {
  recordUsage,
  setBudget,
  budgetStatus,
  summarizeUsage,
  estimateTokenCost,
  createCustomer,
  reportMeteredUsage,
  isStripeConfigured,
  attributionReport,
  recordModelCost,
  type MeterType,
} from "@superior-ai/billing";

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get("organizationId") ?? undefined;
  const wantAttr = req.nextUrl.searchParams.get("attribution") === "1";
  return NextResponse.json({
    usage: summarizeUsage({ organizationId: orgId }),
    budget: orgId ? budgetStatus(orgId) : null,
    stripeConfigured: isStripeConfigured(),
    attribution: wantAttr ? attributionReport({ organizationId: orgId }) : undefined,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === "set_budget") {
      if (!body.organizationId || body.monthlyLimitUsd == null) {
        return NextResponse.json({ error: "organizationId and monthlyLimitUsd required" }, { status: 400 });
      }
      return NextResponse.json(
        setBudget({
          organizationId: body.organizationId,
          monthlyLimitUsd: Number(body.monthlyLimitUsd),
          alertThreshold: body.alertThreshold,
          hardStop: body.hardStop,
        })
      );
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
      if ("blocked" in result && result.blocked) {
        return NextResponse.json(result, { status: 402 });
      }
      if (body.modelId || body.provider) {
        recordModelCost({
          organizationId: body.organizationId,
          projectId: body.projectId,
          userId: body.userId,
          modelId: body.modelId,
          provider: body.provider,
          costUsd: Number(body.costUsd ?? 0),
          tokens: body.quantity,
        });
      }
      if (body.stripeSubscriptionItemId && isStripeConfigured()) {
        await reportMeteredUsage({
          subscriptionItemId: body.stripeSubscriptionItemId,
          quantity: Number(body.quantity ?? 0),
        });
      }
      return NextResponse.json(result, { status: 201 });
    }

    if (body.action === "attribute_model") {
      recordModelCost({
        organizationId: body.organizationId,
        projectId: body.projectId,
        userId: body.userId,
        modelId: body.modelId,
        provider: body.provider,
        costUsd: Number(body.costUsd ?? 0),
        tokens: body.tokens,
      });
      return NextResponse.json({ ok: true }, { status: 201 });
    }

    if (body.action === "estimate") {
      return NextResponse.json({
        estimatedCostUsd: estimateTokenCost(
          Number(body.inputTokens ?? 0),
          Number(body.outputTokens ?? 0),
          body.modelId
        ),
        note: "Estimate only — not invoice-grade",
      });
    }

    if (body.action === "create_customer") {
      const result = await createCustomer({
        email: String(body.email ?? ""),
        name: body.name,
        organizationId: body.organizationId,
      });
      return NextResponse.json(result, { status: result.id ? 201 : 400 });
    }

    if (body.action === "report_stripe_usage") {
      const result = await reportMeteredUsage({
        subscriptionItemId: String(body.subscriptionItemId ?? ""),
        quantity: Number(body.quantity ?? 0),
      });
      return NextResponse.json(result, { status: result.ok ? 200 : 400 });
    }

    return NextResponse.json(
      {
        error:
          "action must be set_budget | record | attribute_model | estimate | create_customer | report_stripe_usage",
      },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
