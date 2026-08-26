/**
 * Opportunity engine — structured suggestions from company signals.
 * Does not invent customer names or unverified revenue.
 */

export type OpportunityKind =
  | "revenue"
  | "cross_sell"
  | "upsell"
  | "market"
  | "cost_reduction"
  | "automation"
  | "product"
  | "retention"
  | "partnership";

export interface Opportunity {
  id: string;
  kind: OpportunityKind;
  title: string;
  rationale: string;
  expectedImpact: "low" | "medium" | "high";
  effort: "low" | "medium" | "high";
  signals: string[];
  nextSteps: string[];
  at: string;
}

export function generateOpportunities(input: {
  signals?: string[];
  hasChurnPressure?: boolean;
  hasHighSupportVolume?: boolean;
  hasUnusedFeatures?: boolean;
  hasManualOps?: boolean;
  hasStrongNps?: boolean;
  adjacentMarketHint?: string;
}): Opportunity[] {
  const at = new Date().toISOString();
  const out: Opportunity[] = [];
  const signals = input.signals ?? [];

  if (input.hasChurnPressure) {
    out.push({
      id: `opp_${out.length}`,
      kind: "retention",
      title: "Reduce churn with win-back and health scores",
      rationale: "Churn pressure signal present — prioritize at-risk accounts.",
      expectedImpact: "high",
      effort: "medium",
      signals: ["churn_pressure", ...signals],
      nextSteps: ["Segment at-risk accounts", "Define playbooks", "Measure save rate"],
      at,
    });
  }
  if (input.hasHighSupportVolume) {
    out.push({
      id: `opp_${out.length}`,
      kind: "automation",
      title: "Automate top support intents",
      rationale: "High support volume can often be deflected with knowledge + agents.",
      expectedImpact: "medium",
      effort: "medium",
      signals: ["support_volume", ...signals],
      nextSteps: ["Cluster ticket intents", "Ship deflection flows", "Track CSAT"],
      at,
    });
  }
  if (input.hasUnusedFeatures) {
    out.push({
      id: `opp_${out.length}`,
      kind: "upsell",
      title: "Drive adoption of underused premium features",
      rationale: "Unused capability often indicates education or packaging gaps.",
      expectedImpact: "medium",
      effort: "low",
      signals: ["unused_features", ...signals],
      nextSteps: ["Identify feature gaps", "In-app guides", "Success outreach"],
      at,
    });
  }
  if (input.hasManualOps) {
    out.push({
      id: `opp_${out.length}`,
      kind: "cost_reduction",
      title: "Automate repetitive operations",
      rationale: "Manual ops increase cost and error rates.",
      expectedImpact: "high",
      effort: "high",
      signals: ["manual_ops", ...signals],
      nextSteps: ["Map top 5 manual workflows", "Automate with approval gates", "Measure hours saved"],
      at,
    });
  }
  if (input.hasStrongNps) {
    out.push({
      id: `opp_${out.length}`,
      kind: "revenue",
      title: "Referral and case-study program",
      rationale: "Strong NPS supports referral and social proof programs.",
      expectedImpact: "medium",
      effort: "low",
      signals: ["strong_nps", ...signals],
      nextSteps: ["Ask promoters", "Publish stories", "Track referred pipeline"],
      at,
    });
  }
  if (input.adjacentMarketHint) {
    out.push({
      id: `opp_${out.length}`,
      kind: "market",
      title: `Explore adjacent market: ${input.adjacentMarketHint}`,
      rationale: "Adjacent market hint provided by operator.",
      expectedImpact: "medium",
      effort: "high",
      signals: ["adjacent_market", ...signals],
      nextSteps: ["Size market", "Talk to 5 prospects", "Pilot offer"],
      at,
    });
  }
  if (!out.length) {
    out.push({
      id: "opp_0",
      kind: "product",
      title: "Collect more operational signals",
      rationale: "Insufficient signals to prioritize opportunities.",
      expectedImpact: "low",
      effort: "low",
      signals,
      nextSteps: ["Connect analytics", "Tag support intents", "Track feature adoption"],
      at,
    });
  }
  return out;
}
