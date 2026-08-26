/**
 * SUPERIOR MODEL COUNCIL + disagreement handling
 * Plans independent roles; does not fabricate model outputs.
 */

import type { ModelDefinition } from "@superior-ai/core";
import { modelRegistry } from "../registry/model-registry";
import { ensureCintexaRegistry } from "../registry/cintexa-models";
import { planCascade } from "./cascade";

export type CouncilRole =
  | "strategist"
  | "researcher"
  | "engineer"
  | "critic"
  | "risk_analyst"
  | "judge";

export interface CouncilSeat {
  role: CouncilRole;
  model: ModelDefinition | null;
  purpose: string;
}

export interface CouncilPlan {
  objective: string;
  seats: CouncilSeat[];
  process: string[];
  disagreementPolicy: string[];
  uncertaintyHandling: string;
  note: string;
}

export interface DisagreementReport {
  claimA: string;
  claimB: string;
  steps: string[];
  resolution: "reanalyze" | "verifier" | "escalate_human" | "prefer_evidence";
}

const ROLE_PURPOSE: Record<CouncilRole, string> = {
  strategist: "High-level options and tradeoffs",
  researcher: "Evidence and source-grounded findings",
  engineer: "Technical feasibility and implementation path",
  critic: "Attack assumptions and find weaknesses",
  risk_analyst: "Security, compliance, financial, operational risk",
  judge: "Synthesize, rank, assign confidence — no hidden CoT exposure",
};

function topModels(n: number): ModelDefinition[] {
  ensureCintexaRegistry();
  return modelRegistry
    .list()
    .filter((m) => m.metadata?.kind !== "product_tier" && m.status !== "DEPRECATED")
    .sort((a, b) => b.scores.reasoning + b.scores.coding - (a.scores.reasoning + a.scores.coding))
    .slice(0, n);
}

export function planCouncil(objective: string): CouncilPlan {
  const models = topModels(6);
  const roles: CouncilRole[] = [
    "strategist",
    "researcher",
    "engineer",
    "critic",
    "risk_analyst",
    "judge",
  ];
  const seats: CouncilSeat[] = roles.map((role, i) => ({
    role,
    model: models[i % Math.max(1, models.length)] ?? null,
    purpose: ROLE_PURPOSE[role],
  }));

  return {
    objective,
    seats,
    process: [
      "1. Each seat analyzes independently",
      "2. Share structured findings (claims, evidence refs, confidence)",
      "3. Disagreement engine ranks conflicts",
      "4. Targeted re-analysis on contested claims",
      "5. Judge synthesizes consensus + uncertainty score",
      "6. Escalate unresolved high-risk issues to human",
    ],
    disagreementPolicy: [
      "Do not average contradictory answers",
      "Extract claims → trace evidence → compare → verify",
      "Prefer evidence-backed claims over fluency",
    ],
    uncertaintyHandling:
      "Emit confidence bands: high | moderate | low | insufficient_evidence",
    note: "Council plans role assignment. Live multi-model execution requires AVAILABLE models + API keys.",
  };
}

export function planDisagreement(claimA: string, claimB: string): DisagreementReport {
  return {
    claimA,
    claimB,
    steps: [
      "detect disagreement",
      "extract atomic claims",
      "trace evidence / tool results",
      "compare evidence quality and freshness",
      "request targeted re-analysis",
      "run verifier role",
      "rank arguments",
      "resolve or escalate",
    ],
    resolution: "prefer_evidence",
  };
}

export function councilWithCascade(objective: string) {
  return {
    cascade: planCascade(objective, { complexity: 5 }),
    council: planCouncil(objective),
  };
}
