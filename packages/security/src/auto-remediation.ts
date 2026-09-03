/**
 * Auto-remediation — plan only; apply requires approval flag.
 */

export interface RemediationPlan {
  id: string;
  problem: string;
  steps: string[];
  reversible: boolean;
  requiresApproval: boolean;
  status: "planned" | "approved" | "applied" | "rejected";
}

const plans = new Map<string, RemediationPlan>();

export function planRemediation(problem: string): RemediationPlan {
  const id = `rem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const plan: RemediationPlan = {
    id,
    problem,
    steps: [
      "Diagnose from logs/status",
      "Select least-privilege fix",
      "Test in dry-run",
      "Apply with approval",
      "Verify health",
      "Record incident outcome",
    ],
    reversible: true,
    requiresApproval: true,
    status: "planned",
  };
  plans.set(id, plan);
  return plan;
}

export function approveRemediation(id: string): RemediationPlan | null {
  const p = plans.get(id);
  if (!p) return null;
  p.status = "approved";
  return p;
}

export function applyRemediation(id: string, approved = false): RemediationPlan | null {
  const p = plans.get(id);
  if (!p) return null;
  if (p.requiresApproval && !approved && p.status !== "approved") {
    return p;
  }
  p.status = "applied";
  return p;
}

export function getRemediation(id: string): RemediationPlan | undefined {
  return plans.get(id);
}
