import type { RouteCriteria } from "@superior-ai/core";
import { modelRegistry, type RegisteredModel } from "../registry/model-registry";

export interface RouteDecision {
  primary: { provider: RegisteredModel["provider"]; modelId: string; displayName: string };
  reason: string;
}

/**
 * Picks the best currently-AVAILABLE model for the given criteria.
 * "Available" means OpenRouter's /models endpoint actually returned it
 * during the last successful health check — nothing here is guessed.
 * Throws (rather than silently falling back to a made-up model id) when
 * OpenRouter hasn't been configured/validated yet, per the "no invented
 * results" design rule in docs/ARCHITECTURE.md.
 */
export function route(criteria: RouteCriteria): RouteDecision {
  const available = modelRegistry.list({ status: "AVAILABLE" });
  if (available.length === 0) {
    throw new Error(
      "No AVAILABLE models. Configure OPENROUTER_API_KEY and call configureAndValidate(\"openrouter\", ...) before routing."
    );
  }

  const wantFrontier =
    criteria.intelligenceLevel === "FRONTIER" || criteria.risk === "high" || criteria.difficulty >= 4;
  const wantFast =
    !wantFrontier && (criteria.intelligenceLevel === "FAST" || criteria.costSensitivity === "high" || criteria.latencySensitivity === "high");
  const targetLevel = wantFrontier ? "FRONTIER" : wantFast ? "FAST" : "BALANCED";

  const scored = available
    .map((m) => {
      let score = m.healthScore;
      if (m.intelligenceLevel === targetLevel) score += 50;
      else if (m.intelligenceLevel === "BALANCED") score += 20; // safe middle ground
      if (criteria.privacyLevel === "sensitive" && m.provider === "local") score += 30;
      return { model: m, score };
    })
    .sort((a, b) => b.score - a.score || a.model.displayName.localeCompare(b.model.displayName));

  const best = scored[0]!.model;
  return {
    primary: { provider: best.provider, modelId: best.modelId, displayName: best.displayName },
    reason: `Selected ${best.displayName} (${targetLevel.toLowerCase()} tier) for task="${criteria.taskType}", risk="${criteria.risk}", difficulty=${criteria.difficulty}.`,
  };
}
