import { NextRequest, NextResponse } from "next/server";
import {
  createLeadShell,
  scoreLead,
  personalizeOutreach,
  autopilotAllowedActions,
  funnelStages,
  upsertLead,
  listLeads,
  getLead,
  qualifyLead,
  buildSalesSequence,
  generateProposal,
  createDealFromLead,
  listDeals,
  pipelineSnapshot,
} from "@superior-ai/sales";
import type { SalesAutopilotMode } from "@superior-ai/core";

export async function GET(req: NextRequest) {
  const view = req.nextUrl.searchParams.get("view");
  if (view === "pipeline") return NextResponse.json(pipelineSnapshot());
  if (view === "leads") return NextResponse.json({ leads: listLeads() });
  if (view === "deals") return NextResponse.json({ deals: listDeals() });
  if (view === "funnel") return NextResponse.json({ stages: funnelStages() });
  return NextResponse.json({
    actions: [
      "create_lead",
      "score",
      "qualify",
      "outreach",
      "sequence",
      "proposal",
      "deal",
      "autopilot",
    ],
    note: "Never invents emails or phones. External sends require approval.",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action ?? "create_lead");

    if (action === "create_lead") {
      const lead = createLeadShell(
        String(body.company ?? "Unknown Co"),
        body.website,
        body.source ?? "manual"
      );
      if (body.industry) lead.industry = String(body.industry);
      // Only accept contacts explicitly provided — never invent
      if (Array.isArray(body.publicContacts)) {
        lead.publicContacts = body.publicContacts.map(String).filter(Boolean);
      }
      upsertLead(lead);
      return NextResponse.json(lead, { status: 201 });
    }

    if (action === "score") {
      return NextResponse.json(
        scoreLead({
          industryFit: Number(body.industryFit ?? 50),
          sizeFit: Number(body.sizeFit ?? 50),
          publicSignals: Number(body.publicSignals ?? 40),
          engagement: Number(body.engagement ?? 30),
        })
      );
    }

    if (action === "qualify" && body.leadId) {
      const lead = qualifyLead(String(body.leadId), {
        fitScore: body.fitScore,
        intentScore: body.intentScore,
        notes: body.notes,
      });
      if (!lead) return NextResponse.json({ error: "lead not found" }, { status: 404 });
      return NextResponse.json(lead);
    }

    if (action === "outreach") {
      const lead =
        (body.leadId && getLead(String(body.leadId))) ||
        createLeadShell(String(body.company ?? "Company"), body.website);
      return NextResponse.json(personalizeOutreach(lead, String(body.product ?? "Product")));
    }

    if (action === "sequence") {
      return NextResponse.json({
        steps: buildSalesSequence(String(body.product ?? "Product"), body.mode === "inbound" ? "inbound" : "outbound"),
      });
    }

    if (action === "proposal") {
      return NextResponse.json(
        generateProposal({
          company: String(body.company ?? "Company"),
          product: String(body.product ?? "Product"),
          problem: String(body.problem ?? "follow-up capacity"),
          valuePoints: body.valuePoints,
          priceNote: body.priceNote,
        })
      );
    }

    if (action === "deal" && body.leadId) {
      const lead = getLead(String(body.leadId));
      if (!lead) return NextResponse.json({ error: "lead not found" }, { status: 404 });
      const deal = createDealFromLead(lead, {
        title: body.title,
        value: body.value,
        currency: body.currency,
        stage: body.stage,
      });
      return NextResponse.json(deal, { status: 201 });
    }

    if (action === "autopilot") {
      const mode = (body.mode ?? "assist") as SalesAutopilotMode;
      return NextResponse.json({
        mode,
        allowed: autopilotAllowedActions(mode),
        note: "Autonomous external sends still require approval policy wiring.",
      });
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
