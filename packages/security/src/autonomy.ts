/**
 * Autonomy boundaries, action risk, reversibility
 */

export type AutonomyLevel =
  | "ASSISTED"
  | "SUPERVISED"
  | "SEMI_AUTONOMOUS"
  | "AUTONOMOUS"
  | "FULL_WORKFLOW_AUTONOMY";

export type Reversibility = "reversible" | "partially_reversible" | "irreversible";

export interface AutonomyBoundary {
  agentId: string;
  level: AutonomyLevel;
  allowedActions: string[];
  forbiddenActions: string[];
  approvalActions: string[];
  escalationActions: string[];
}

export interface ActionRiskInput {
  action: string;
  financialImpact?: number;
  dataSensitivity?: "public" | "internal" | "confidential" | "restricted";
  customerImpact?: "none" | "single" | "segment" | "all";
  irreversibility?: Reversibility;
  legalImpact?: boolean;
  securityImpact?: boolean;
  scope?: "narrow" | "wide";
}

export interface ActionRiskResult {
  score: number; // 0-100
  band: "low" | "medium" | "high" | "critical";
  requiresApproval: boolean;
  reasons: string[];
}

const boundaries = new Map<string, AutonomyBoundary>();

export function setAutonomyBoundary(b: AutonomyBoundary): void {
  boundaries.set(b.agentId, b);
}

export function getAutonomyBoundary(agentId: string): AutonomyBoundary | undefined {
  return boundaries.get(agentId);
}

export function scoreActionRisk(input: ActionRiskInput): ActionRiskResult {
  let score = 10;
  const reasons: string[] = [];

  if ((input.financialImpact ?? 0) > 10000) {
    score += 35;
    reasons.push("High financial impact");
  } else if ((input.financialImpact ?? 0) > 1000) {
    score += 20;
    reasons.push("Moderate financial impact");
  }

  const sens = input.dataSensitivity ?? "internal";
  if (sens === "restricted") {
    score += 30;
    reasons.push("Restricted data");
  } else if (sens === "confidential") {
    score += 20;
    reasons.push("Confidential data");
  }

  if (input.customerImpact === "all") {
    score += 25;
    reasons.push("All-customer impact");
  } else if (input.customerImpact === "segment") {
    score += 15;
    reasons.push("Segment impact");
  }

  if (input.irreversibility === "irreversible") {
    score += 25;
    reasons.push("Irreversible action");
  } else if (input.irreversibility === "partially_reversible") {
    score += 10;
    reasons.push("Partially reversible");
  }

  if (input.legalImpact) {
    score += 20;
    reasons.push("Legal impact");
  }
  if (input.securityImpact) {
    score += 20;
    reasons.push("Security impact");
  }
  if (input.scope === "wide") {
    score += 10;
    reasons.push("Wide scope");
  }

  score = Math.min(100, score);
  const band =
    score >= 80 ? "critical" : score >= 60 ? "high" : score >= 35 ? "medium" : "low";
  return {
    score,
    band,
    requiresApproval: band === "high" || band === "critical",
    reasons,
  };
}

export function isActionAllowed(
  agentId: string,
  action: string
): { allowed: boolean; needsApproval: boolean; reason: string } {
  const b = boundaries.get(agentId);
  if (!b) {
    return { allowed: true, needsApproval: false, reason: "No boundary set — default allow (local-first)" };
  }
  if (b.forbiddenActions.includes(action) || b.forbiddenActions.includes("*")) {
    return { allowed: false, needsApproval: false, reason: "Forbidden by autonomy boundary" };
  }
  if (b.approvalActions.includes(action)) {
    return { allowed: true, needsApproval: true, reason: "Approval required" };
  }
  if (b.allowedActions.includes(action) || b.allowedActions.includes("*")) {
    return { allowed: true, needsApproval: false, reason: "Allowed" };
  }
  if (b.level === "ASSISTED" || b.level === "SUPERVISED") {
    return { allowed: true, needsApproval: true, reason: "Supervised level — approve by default" };
  }
  return { allowed: false, needsApproval: false, reason: "Not in allowedActions" };
}
