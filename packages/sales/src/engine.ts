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
