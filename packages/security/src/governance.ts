/**
 * Governance Board — reviews major/high-risk proposed changes before
 * execution. Each board seat produces a real, derived assessment from
 * scoreActionRisk() and the proposal's own stated attributes — not
 * fabricated opinions. The board's verdict is deterministic given the
 * same inputs, so it's auditable, not another LLM guess.
 */

import { scoreActionRisk, type ActionRiskInput, type ActionRiskResult } from "./autonomy";

export type BoardSeat = "security" | "compliance" | "risk" | "finance" | "technology" | "ai_governance";

export interface BoardAssessment {
  seat: BoardSeat;
  verdict: "approve" | "approve_with_conditions" | "reject" | "abstain";
  reasoning: string;
  conditions: string[];
}

export interface GovernanceProposal {
  id: string;
  title: string;
  description: string;
  proposedBy: string;
  risk: ActionRiskInput;
  modelChange?: boolean; // e.g. switching default model/provider
  policyChange?: boolean; // e.g. changing an org/security policy
  dataResidencyChange?: boolean;
}

export interface GovernanceDecision {
  proposalId: string;
  riskResult: ActionRiskResult;
  assessments: BoardAssessment[];
  finalVerdict: "approved" | "approved_with_conditions" | "rejected" | "escalated_to_human";
  allConditions: string[];
  decidedAt: string;
}

function securitySeat(risk: ActionRiskResult, p: GovernanceProposal): BoardAssessment {
  if (risk.reasons.some((r) => r.includes("Security"))) {
    return {
      seat: "security",
      verdict: risk.band === "critical" ? "reject" : "approve_with_conditions",
      reasoning: `Flagged security impact (risk score ${risk.score}). ${risk.band === "critical" ? "Too high to approve without a dedicated security review." : "Requires a security sign-off before execution."}`,
      conditions: risk.band === "critical" ? [] : ["Security review completed before execution"],
    };
  }
  return { seat: "security", verdict: "approve", reasoning: "No flagged security impact.", conditions: [] };
}

function complianceSeat(p: GovernanceProposal): BoardAssessment {
  if (p.dataResidencyChange) {
    return {
      seat: "compliance",
      verdict: "approve_with_conditions",
      reasoning: "Data residency change requires confirming the new configuration meets applicable regional requirements before rollout.",
      conditions: ["Confirm data residency requirements met for all affected regions"],
    };
  }
  if (p.risk.legalImpact) {
    return {
      seat: "compliance",
      verdict: "approve_with_conditions",
      reasoning: "Proposal has a stated legal impact — needs compliance sign-off.",
      conditions: ["Legal/compliance sign-off obtained"],
    };
  }
  return { seat: "compliance", verdict: "approve", reasoning: "No compliance-relevant impact flagged.", conditions: [] };
}

function riskSeat(risk: ActionRiskResult): BoardAssessment {
  const verdict =
    risk.band === "critical" ? "reject" : risk.band === "high" ? "approve_with_conditions" : "approve";
  return {
    seat: "risk",
    verdict,
    reasoning: `Composite risk score ${risk.score}/100 (${risk.band}). Contributing factors: ${risk.reasons.join(", ") || "none flagged"}.`,
    conditions: verdict === "approve_with_conditions" ? ["Document rollback plan before execution"] : [],
  };
}

function financeSeat(p: GovernanceProposal): BoardAssessment {
  const impact = p.risk.financialImpact ?? 0;
  if (impact > 10000) {
    return {
      seat: "finance",
      verdict: "approve_with_conditions",
      reasoning: `Stated financial impact ($${impact.toLocaleString()}) exceeds the $10,000 threshold for automatic approval.`,
      conditions: ["Finance sign-off on budget impact before execution"],
    };
  }
  return { seat: "finance", verdict: "approve", reasoning: "Financial impact within automatic-approval threshold.", conditions: [] };
}

function technologySeat(p: GovernanceProposal): BoardAssessment {
  if (p.modelChange) {
    return {
      seat: "technology",
      verdict: "approve_with_conditions",
      reasoning: "Proposal changes the default model/provider — verify the new model's capabilities and fallback chain are configured before rollout.",
      conditions: ["Confirm fallback chain configured for new model", "Run against golden task suite before full rollout"],
    };
  }
  return { seat: "technology", verdict: "approve", reasoning: "No model/infrastructure change flagged.", conditions: [] };
}

function aiGovernanceSeat(risk: ActionRiskResult, p: GovernanceProposal): BoardAssessment {
  if (p.policyChange && risk.band !== "low") {
    return {
      seat: "ai_governance",
      verdict: "abstain",
      reasoning: "Policy change combined with non-trivial risk — recommends human governance review rather than automatic approval.",
      conditions: [],
    };
  }
  return { seat: "ai_governance", verdict: "approve", reasoning: "No policy change or risk low enough for standard review.", conditions: [] };
}

export function reviewProposal(p: GovernanceProposal): GovernanceDecision {
  const riskResult = scoreActionRisk(p.risk);

  const assessments: BoardAssessment[] = [
    securitySeat(riskResult, p),
    complianceSeat(p),
    riskSeat(riskResult),
    financeSeat(p),
    technologySeat(p),
    aiGovernanceSeat(riskResult, p),
  ];

  const anyReject = assessments.some((a) => a.verdict === "reject");
  const anyEscalate = p.policyChange && riskResult.band !== "low";
  const anyConditions = assessments.some((a) => a.verdict === "approve_with_conditions");

  let finalVerdict: GovernanceDecision["finalVerdict"];
  if (anyReject) finalVerdict = "rejected";
  else if (anyEscalate || riskResult.band === "critical") finalVerdict = "escalated_to_human";
  else if (anyConditions) finalVerdict = "approved_with_conditions";
  else finalVerdict = "approved";

  const allConditions = Array.from(new Set(assessments.flatMap((a) => a.conditions)));

  return {
    proposalId: p.id,
    riskResult,
    assessments,
    finalVerdict,
    allConditions,
    decidedAt: new Date().toISOString(),
  };
}
