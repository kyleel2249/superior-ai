import { NextRequest, NextResponse } from "next/server";
import {
  recordAttributionEvent,
  listAttributionEvents,
  rollupByChannel,
  rollupByCampaign,
  funnelSummary,
  seedDemoAttribution,
} from "@superior-ai/intelligence";
import { attributionReport, recordModelCost, recordUsage } from "@superior-ai/billing";

export async function GET(req: NextRequest) {
  const view = req.nextUrl.searchParams.get("view") ?? "funnel";
  if (view === "events") {
    return NextResponse.json({ events: listAttributionEvents(200) });
  }
  if (view === "channels") {
    return NextResponse.json({ channels: rollupByChannel() });
  }
  if (view === "campaigns") {
    return NextResponse.json({ campaigns: rollupByCampaign() });
  }
  if (view === "cost") {
    const orgId = req.nextUrl.searchParams.get("organizationId") ?? undefined;
    return NextResponse.json({
      cost: attributionReport({ organizationId: orgId }),
      note: "AI cost attribution from recorded meter/model events. Optional — not shown as mandatory billing UI.",
    });
  }
  return NextResponse.json({
    funnel: funnelSummary(),
    channels: rollupByChannel(),
    campaigns: rollupByCampaign(),
    note: "Marketing attribution from observed events only.",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action ?? "record");

    if (action === "seed_demo") {
      return NextResponse.json(seedDemoAttribution());
    }

    if (action === "record_cost") {
      recordModelCost({
        organizationId: body.organizationId,
        projectId: body.projectId,
        userId: body.userId,
        modelId: body.modelId,
        provider: body.provider,
        costUsd: Number(body.costUsd ?? 0),
        tokens: body.tokens,
      });
      if (body.meter) {
        recordUsage({
          organizationId: body.organizationId,
          userId: body.userId,
          meter: body.meter,
          quantity: Number(body.quantity ?? 1),
          costUsd: body.costUsd,
          provider: body.provider,
          modelId: body.modelId,
        });
      }
      return NextResponse.json({ ok: true });
    }

    if (!body.type) {
      return NextResponse.json({ error: "type required (impression|click|visit|lead|sql|opportunity|won|revenue)" }, { status: 400 });
    }

    const event = recordAttributionEvent({
      type: body.type,
      campaignId: body.campaignId,
      channel: body.channel,
      source: body.source,
      medium: body.medium,
      content: body.content,
      value: body.value != null ? Number(body.value) : undefined,
      currency: body.currency,
      meta: body.meta,
    });
    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
