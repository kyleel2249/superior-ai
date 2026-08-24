/**
 * Autonomous Sales Engine
 * Approval-gated external actions. Never invent contact information.
 */

import type { Lead, SalesIntelligence, SalesAutopilotMode, DataProvenance } from "@superior-ai/core";

export function scoreLead(input: {
  industryFit: number;
  sizeFit: number;
  publicSignals: number;
  engagement: number;
}): SalesIntelligence {
  const fit = Math.round((input.industryFit + input.sizeFit) / 2);
  const intent = input.publicSignals;
  const engagement = input.engagement;
  const opportunity = Math.round(fit * 0.4 + intent * 0.35 + engagement * 0.25);
  const closeProbability = Math.min(85, Math.round(opportunity * 0.7));
  return {
    leadScore: opportunity,
    fitScore: fit,
    intentScore: intent,
    engagementScore: engagement,
    opportunityScore: opportunity,
    closeProbability,
    expectedRevenue: 0,
    expectedDaysToClose: closeProbability > 50 ? 30 : 60,
    riskScore: 100 - closeProbability,
  };
}

export function createLeadShell(company: string, website?: string, source = "research"): Lead {
  return {
    id: `lead_${company.toLowerCase().replace(/\W+/g, "_")}_${Date.now()}`,
    company,
    website,
    publicContacts: [],
    decisionMakers: [],
    fitScore: 0,
    opportunityScore: 0,
    intentScore: 0,
    engagementScore: 0,
    source,
    confidence: 20,
    status: "new",
    provenance: "Model Inference" as DataProvenance,
  };
}

export function personalizeOutreach(lead: Lead, product: string): {
  emailSubject: string;
  emailBody: string;
  linkedinStyle: string;
  callScript: string;
  disclaimer: string;
} {
  const company = lead.company;
  return {
    emailSubject: `Quick idea for ${company}`,
    emailBody: `Hi — I noticed ${company}${lead.website ? ` (${lead.website})` : ""}. Many teams in similar situations struggle with follow-up consistency. ${product} helps automate that without replacing the human relationship.\n\nWould a 15-minute walkthrough be useful?\n\n[Approval required before send]`,
    linkedinStyle: `Appreciate the work ${company} is doing. Curious if follow-up capacity is a bottleneck — happy to share how peers handle it with ${product}.`,
    callScript: `Open: confirm timing. Probe: current follow-up process. Bridge: ${product}. Ask: demo or resources.`,
    disclaimer: "Personalization uses only provided/public fields. Never invent emails or phone numbers. External send requires approval policy.",
  };
}

export function autopilotAllowedActions(mode: SalesAutopilotMode): string[] {
  switch (mode) {
    case "assist":
      return ["draft_outreach", "score_leads", "suggest_next_step"];
    case "recommend":
      return ["draft_outreach", "score_leads", "suggest_next_step", "propose_sequence"];
    case "semi_autonomous":
      return ["draft_outreach", "score_leads", "queue_approved_sends", "update_crm_draft"];
    case "autonomous":
      return [
        "identify_leads",
        "score_leads",
        "prepare_outreach",
        "send_approved_campaigns",
        "follow_up",
        "update_crm",
        "schedule_meetings",
        "generate_proposals",
      ];
    default:
      return ["draft_outreach"];
  }
}

export function funnelStages(): string[] {
  return [
    "Traffic",
    "Landing Page",
    "Lead Magnet",
    "Lead Capture",
    "Qualification",
    "Follow-Up",
    "Sales Conversation",
    "Proposal",
    "Payment",
    "Onboarding",
    "Retention",
    "Referral",
  ];
}

/** In-memory pipeline for local-first; CRM connectors sync when configured */
const pipelineStore = new Map<string, Lead>();
const dealStore = new Map<string, import("@superior-ai/core").Deal>();

export function upsertLead(lead: Lead): Lead {
  pipelineStore.set(lead.id, lead);
  return lead;
}

export function getLead(id: string): Lead | null {
  return pipelineStore.get(id) ?? null;
}

export function listLeads(filter?: { status?: Lead["status"] }): Lead[] {
  let rows = [...pipelineStore.values()];
  if (filter?.status) rows = rows.filter((l) => l.status === filter.status);
  return rows;
}

export function qualifyLead(
  id: string,
  input: { fitScore?: number; intentScore?: number; notes?: string }
): Lead | null {
  const lead = pipelineStore.get(id);
  if (!lead) return null;
  if (input.fitScore != null) lead.fitScore = input.fitScore;
  if (input.intentScore != null) lead.intentScore = input.intentScore;
  const intel = scoreLead({
    industryFit: lead.fitScore,
    sizeFit: lead.fitScore,
    publicSignals: lead.intentScore,
    engagement: lead.engagementScore,
  });
  lead.opportunityScore = intel.opportunityScore;
  lead.status = lead.fitScore >= 50 && lead.intentScore >= 40 ? "qualified" : lead.status;
  lead.confidence = Math.min(90, lead.confidence + 10);
  pipelineStore.set(id, lead);
  return lead;
}

export interface SequenceStep {
  day: number;
  channel: "email" | "linkedin" | "call" | "task";
  purpose: string;
  template: string;
  requiresApproval: boolean;
}

export function buildSalesSequence(product: string, mode: "outbound" | "inbound" = "outbound"): SequenceStep[] {
  if (mode === "inbound") {
    return [
      { day: 0, channel: "email", purpose: "Welcome + value", template: `Thanks for your interest in ${product}. Here's what happens next.`, requiresApproval: true },
      { day: 2, channel: "email", purpose: "Case pattern", template: `How peers use ${product} to fix follow-up gaps.`, requiresApproval: true },
      { day: 5, channel: "call", purpose: "Discovery", template: "Confirm goals, timeline, stakeholders.", requiresApproval: true },
      { day: 8, channel: "email", purpose: "Proposal or demo", template: `Demo link / proposal for ${product}.`, requiresApproval: true },
    ];
  }
  return [
    { day: 0, channel: "email", purpose: "Permission + relevance", template: `Personalized note about ${product} (no invented contacts).`, requiresApproval: true },
    { day: 3, channel: "linkedin", purpose: "Soft bump", template: "Reference public company context only.", requiresApproval: true },
    { day: 7, channel: "email", purpose: "Value asset", template: "Share checklist or brief — approval required.", requiresApproval: true },
    { day: 12, channel: "call", purpose: "Breakup or book", template: "Final polite attempt; respect opt-out.", requiresApproval: true },
  ];
}

export function generateProposal(input: {
  company: string;
  product: string;
  problem: string;
  valuePoints?: string[];
  priceNote?: string;
}): {
  title: string;
  sections: Array<{ heading: string; body: string }>;
  disclaimer: string;
} {
  const valuePoints = input.valuePoints ?? [
    "Faster follow-up without losing the human touch",
    "Clearer pipeline visibility",
    "Less admin for the team",
  ];
  return {
    title: `Proposal: ${input.product} for ${input.company}`,
    sections: [
      { heading: "Situation", body: `${input.company} is addressing: ${input.problem}.` },
      { heading: "Proposed approach", body: `${input.product} supports a structured workflow from lead capture through retention.` },
      { heading: "Outcomes we optimize for", body: valuePoints.map((v) => `• ${v}`).join("\n") },
      { heading: "Commercial", body: input.priceNote ?? "Pricing confirmed in live quote — not invented here." },
      { heading: "Next step", body: "Agree scope → pilot → success criteria → rollout." },
    ],
    disclaimer: "Proposal draft only. Pricing and legal terms require human approval. No fabricated customer references.",
  };
}

export function createDealFromLead(
  lead: Lead,
  input: { title?: string; value?: number; currency?: string; stage?: string }
): import("@superior-ai/core").Deal {
  const deal = {
    id: `deal_${Date.now().toString(36)}`,
    leadId: lead.id,
    title: input.title ?? `${lead.company} — opportunity`,
    value: input.value ?? 0,
    currency: input.currency ?? "USD",
    stage: input.stage ?? "qualification",
    closeProbability: lead.opportunityScore || 20,
    riskScore: 100 - (lead.opportunityScore || 20),
  };
  dealStore.set(deal.id, deal);
  lead.status = "opportunity";
  pipelineStore.set(lead.id, lead);
  return deal;
}

export function listDeals(): import("@superior-ai/core").Deal[] {
  return [...dealStore.values()];
}

export function pipelineSnapshot(): {
  stages: Record<string, number>;
  leads: number;
  deals: number;
  note: string;
} {
  const stages: Record<string, number> = {};
  for (const l of pipelineStore.values()) {
    stages[l.status] = (stages[l.status] ?? 0) + 1;
  }
  return {
    stages,
    leads: pipelineStore.size,
    deals: dealStore.size,
    note: "Local pipeline store. Sync to HubSpot/Salesforce when CRM credentials configured.",
  };
}
