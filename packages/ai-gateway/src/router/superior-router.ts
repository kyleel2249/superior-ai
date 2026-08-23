import type { IntelligenceLevel, TaskType } from "@superior-ai/core";
import { modelRegistry, type RegisteredModel } from "../registry/model-registry";

export interface RouteInput {
  taskType: TaskType;
  difficulty: number;
  risk: "low" | "medium" | "high";
  requiredReasoning: boolean;
  requiredTools: string[];
  requiredModality: Array<"text" | "image" | "audio" | "video">;
  costSensitivity: "low" | "medium" | "high";
  latencySensitivity: "low" | "medium" | "high";
  privacyLevel: "standard" | "elevated" | "strict";
  intelligenceLevel: IntelligenceLevel;
}

export interface RouteDecision {
  primary: { provider: RegisteredModel["provider"]; modelId: string; displayName: string };
  reason: string;
}

export function route(input: RouteInput): RouteDecision {
  const target = pickIntelligenceLevel(input);
  const best = modelRegistry.bestAvailable(target);

  if (best) {
    return {
      primary: { provider: best.provider, modelId: best.modelId, displayName: best.displayName },
      reason: `Selected ${best.displayName} (${best.provider}) — closest AVAILABLE match for intelligenceLevel=${target}, taskType=${input.taskType}.`,
    };
  }

  // Nothing has been validated against a live API key yet. Route to the seed
  // catalog's default for this level anyway so the caller gets a clear
  // "API key not configured" error from the adapter, rather than a router-level
  // failure that hides which provider needs configuring.
  const fallback = modelRegistry.list({ intelligenceLevel: target })[0] ?? modelRegistry.list()[0];
  if (!fallback) {
    throw new Error("No models registered — the model registry's seed catalog is empty.");
  }
  return {
    primary: { provider: fallback.provider, modelId: fallback.modelId, displayName: fallback.displayName },
    reason: `No provider has been validated yet. Routing to ${fallback.displayName} (${fallback.provider}) by default — configure its API key to make it AVAILABLE.`,
  };
}

function pickIntelligenceLevel(input: RouteInput): IntelligenceLevel {
  if (input.intelligenceLevel) return input.intelligenceLevel;
  if (input.requiredReasoning || input.difficulty >= 4) return "REASONING";
  if (input.latencySensitivity === "high" || input.costSensitivity === "high") return "FAST";
  if (input.difficulty >= 3) return "POWERFUL";
  return "BALANCED";
}
