/**
 * MODEL CASCADE — start cheapest adequate model; escalate only when needed.
 * worker → balanced → advanced → frontier → multi-model panel → human review
 */

import type { ModelDefinition } from "@superior-ai/core";
import { modelRegistry } from "../registry/model-registry";
import { route } from "./superior-router";
import { classifyTask } from "./task-classifier";
import { ensureCintexaRegistry } from "../registry/cintexa-models";

export type CascadeTier =
  | "worker"
  | "balanced"
  | "advanced"
  | "frontier"
  | "panel"
  | "human_review";

export interface CascadeStep {
  tier: CascadeTier;
  model: ModelDefinition | null;
  reason: string;
}

export interface CascadePlan {
  taskSummary: string;
  complexity: number;
  steps: CascadeStep[];
  primary: CascadeStep;
  escalationTriggers: string[];
  note: string;
}

const TIER_ORDER: CascadeTier[] = [
  "worker",
  "balanced",
  "advanced",
  "frontier",
  "panel",
  "human_review",
];

function pickByCostLatency(minReasoning: number, maxCostBias = 100): ModelDefinition | null {
  ensureCintexaRegistry();
  const all = modelRegistry.list();
  const candidates = all
    .filter((m) => m.status !== "DEPRECATED")
    .filter((m) => m.scores.reasoning >= minReasoning || m.scores.coding >= minReasoning - 10)
    .sort((a, b) => b.scores.cost + b.scores.latency - (a.scores.cost + a.scores.latency));
  return candidates[0] ?? null;
}

function pickFrontier(): ModelDefinition | null {
  ensureCintexaRegistry();
  const all = modelRegistry.list();
  return (
    all
      .filter((m) => m.status !== "DEPRECATED" && m.metadata?.kind !== "product_tier")
      .sort((a, b) => b.scores.reasoning + b.scores.coding - (a.scores.reasoning + a.scores.coding))[0] ??
    null
  );
}

export function estimateComplexity(text: string, explicit?: number): number {
  if (typeof explicit === "number") return Math.max(0, Math.min(5, explicit));
  let c = 1;
  const len = text.length;
  if (len > 500) c++;
  if (len > 2000) c++;
  if (/\b(architect|migrate|security|audit|multi-agent|refactor)\b/i.test(text)) c += 2;
  if (/\b(debug|implement|research|compare|strategy)\b/i.test(text)) c++;
  if (/\b(frontier|maximum|ensemble|council)\b/i.test(text)) c = Math.max(c, 4);
  return Math.min(5, c);
}

export function planCascade(
  text: string,
  opts?: { complexity?: number; forceTier?: CascadeTier }
): CascadePlan {
  const complexity = estimateComplexity(text, opts?.complexity);
  const decision = route(
    classifyTask(text, {
      intelligenceLevel: complexity >= 4 ? "EXPERT" : complexity >= 2 ? "BALANCED" : "FAST",
      difficulty: (Math.min(5, Math.max(1, complexity)) as 1 | 2 | 3 | 4 | 5),
    })
  );

  const worker = pickByCostLatency(40);
  const balanced = pickByCostLatency(70);
  const advanced = pickByCostLatency(80);
  const frontier = pickFrontier() ?? decision.primary;

  const steps: CascadeStep[] = [
    {
      tier: "worker",
      model: worker,
      reason: "Low-cost extraction / classification / simple transform",
    },
    {
      tier: "balanced",
      model: balanced,
      reason: "General agent work when worker quality insufficient",
    },
    {
      tier: "advanced",
      model: advanced,
      reason: "Hard coding / multi-step analysis",
    },
    {
      tier: "frontier",
      model: frontier,
      reason: "Architecture, high-stakes reasoning, large repos",
    },
    {
      tier: "panel",
      model: frontier,
      reason: "Multi-model council when single frontier still uncertain",
    },
    {
      tier: "human_review",
      model: null,
      reason: "Irreversible, legal, financial, or security-critical actions",
    },
  ];

  let startIdx = 0;
  if (complexity >= 2) startIdx = 1;
  if (complexity >= 3) startIdx = 2;
  if (complexity >= 4) startIdx = 3;
  if (complexity >= 5) startIdx = 4;
  if (opts?.forceTier) {
    const i = TIER_ORDER.indexOf(opts.forceTier);
    if (i >= 0) startIdx = i;
  }

  return {
    taskSummary: text.slice(0, 200),
    complexity,
    steps,
    primary: steps[startIdx]!,
    escalationTriggers: [
      "quality_score < threshold",
      "confidence low",
      "tool failure repeats",
      "context overflow",
      "policy requires verification",
    ],
    note: "Cascade plans escalation; actual model calls require configured OPENROUTER_API_KEY and AVAILABLE status.",
  };
}

export function nextCascadeTier(current: CascadeTier): CascadeTier | null {
  const i = TIER_ORDER.indexOf(current);
  if (i < 0 || i >= TIER_ORDER.length - 1) return null;
  return TIER_ORDER[i + 1]!;
}
