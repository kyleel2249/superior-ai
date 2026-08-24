/**
 * Multi-model ensemble planner — roles, conflict detection, synthesis rules.
 * Does not invent provider responses; plans parallel calls and merge strategy.
 */

import type { IntelligenceLevel, RoutingDecision, RoutingRequest } from "@superior-ai/core";
import { route } from "./superior-router";
import { classifyTask } from "./task-classifier";

export type EnsembleMode =
  | "single"
  | "multi"
  | "council"
  | "maximum"
  | "supreme"
  | "autonomous";

export interface EnsembleRolePlan {
  role: "primary" | "secondary" | "critic" | "verifier" | "specialist" | "fallback";
  modelId: string;
  provider: string;
  displayName: string;
  purpose: string;
}

export interface EnsemblePlan {
  mode: EnsembleMode;
  request: RoutingRequest;
  decision: RoutingDecision;
  roles: EnsembleRolePlan[];
  parallel: boolean;
  conflictPolicy: "prefer_primary" | "prefer_critic_on_disagreement" | "synthesize";
  synthesisRules: string[];
  toolApprovalRequired: boolean;
}

export function intelligenceToMode(level: IntelligenceLevel): EnsembleMode {
  switch (level) {
    case "FAST":
    case "BALANCED":
      return "single";
    case "DEEP":
      return "multi";
    case "EXPERT":
      return "council";
    case "MAXIMUM":
      return "maximum";
    case "SUPREME":
      return "supreme";
    case "AUTONOMOUS":
      return "autonomous";
    default:
      return "single";
  }
}

export function planEnsemble(
  text: string,
  overrides?: Partial<RoutingRequest>
): EnsemblePlan {
  const request = classifyTask(text, overrides);
  const decision = route(request);
  const mode = intelligenceToMode(request.intelligenceLevel);

  const roles: EnsembleRolePlan[] = [
    {
      role: "primary",
      modelId: decision.primary.modelId,
      provider: decision.primary.provider,
      displayName: decision.primary.displayName,
      purpose: "Main draft / solution",
    },
  ];

  if (mode !== "single" && decision.secondary) {
    roles.push({
      role: "secondary",
      modelId: decision.secondary.modelId,
      provider: decision.secondary.provider,
      displayName: decision.secondary.displayName,
      purpose: "Alternate perspective",
    });
  }

  if ((mode === "council" || mode === "maximum" || mode === "supreme" || mode === "autonomous") && decision.critic) {
    roles.push({
      role: "critic",
      modelId: decision.critic.modelId,
      provider: decision.critic.provider,
      displayName: decision.critic.displayName,
      purpose: "Challenge assumptions, find gaps",
    });
  }

  if (mode === "supreme" || mode === "autonomous" || mode === "maximum") {
    const verifier = decision.factCheck ?? decision.secondary ?? decision.primary;
    roles.push({
      role: "verifier",
      modelId: verifier.modelId,
      provider: verifier.provider,
      displayName: verifier.displayName,
      purpose: "Evidence check; reject unsupported claims",
    });
  }

  if (decision.executor && (request.taskType === "coding" || mode === "autonomous")) {
    roles.push({
      role: "specialist",
      modelId: decision.executor.modelId,
      provider: decision.executor.provider,
      displayName: decision.executor.displayName,
      purpose: "Specialist execution (code / tools)",
    });
  }

  if (decision.fallback[0]) {
    roles.push({
      role: "fallback",
      modelId: decision.fallback[0].modelId,
      provider: decision.fallback[0].provider,
      displayName: decision.fallback[0].displayName,
      purpose: "Failover if primary fails",
    });
  }

  const parallel = mode !== "single";

  return {
    mode,
    request,
    decision,
    roles,
    parallel,
    conflictPolicy:
      mode === "supreme" || mode === "maximum"
        ? "synthesize"
        : mode === "council"
          ? "prefer_critic_on_disagreement"
          : "prefer_primary",
    synthesisRules: [
      "Produce exactly one final answer — no duplicate finals.",
      "Label disagreements between models when conflictPolicy is synthesize.",
      "Never invent sources or metrics.",
      "If primary fails, use fallback without restarting the full ensemble.",
      mode === "autonomous"
        ? "External tools require approval unless marked public-read (e.g. web_search)."
        : "Prefer plan-safe actions.",
    ],
    toolApprovalRequired: mode === "autonomous" || request.risk === "high" || request.risk === "critical",
  };
}

/**
 * Detect conflict between candidate answers (heuristic, no LLM required).
 */
export function detectConflict(answers: Array<{ role: string; text: string }>): {
  hasConflict: boolean;
  notes: string[];
} {
  if (answers.length < 2) return { hasConflict: false, notes: [] };
  const notes: string[] = [];
  const normalized = answers.map((a) => a.text.trim().toLowerCase().slice(0, 500));
  // polarity-ish signals
  const yes = normalized.filter((t) => /\b(yes|recommend|should|agree)\b/.test(t)).length;
  const no = normalized.filter((t) => /\b(no|not recommend|disagree|avoid)\b/.test(t)).length;
  if (yes > 0 && no > 0) notes.push("Mixed recommendation polarity across models");
  // length disparity often indicates different depth
  const lengths = answers.map((a) => a.text.length);
  const max = Math.max(...lengths);
  const min = Math.min(...lengths);
  if (max > 0 && min / max < 0.25) notes.push("Large length disparity between drafts");
  return { hasConflict: notes.length > 0, notes };
}

/**
 * Synthesize final text from role drafts (deterministic merge, not a second LLM call).
 * Callers may replace this with a synthesis-model pass when credentials exist.
 */
export function synthesizeFinal(input: {
  primary: string;
  secondary?: string;
  critic?: string;
  verifier?: string;
  conflictNotes?: string[];
}): string {
  const parts: string[] = [];
  parts.push(input.primary.trim());
  if (input.critic?.trim()) {
    parts.push("\n\n— Critic notes —\n" + input.critic.trim());
  }
  if (input.verifier?.trim()) {
    parts.push("\n\n— Verification —\n" + input.verifier.trim());
  }
  if (input.secondary?.trim() && input.secondary.trim() !== input.primary.trim()) {
    parts.push("\n\n— Alternate view —\n" + input.secondary.trim().slice(0, 2000));
  }
  if (input.conflictNotes?.length) {
    parts.push("\n\n— Conflicts detected —\n" + input.conflictNotes.map((n) => `• ${n}`).join("\n"));
  }
  return parts.join("").trim();
}
