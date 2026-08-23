/**
 * SUPERIOR ROUTER
 * Classifies task → selects PRIMARY / SECONDARY / CRITIC / FALLBACK models.
 * Never blindly routes everything to the most expensive model.
 */

import type {
  ModelDefinition,
  RoutingRequest,
  RoutingDecision,
  IntelligenceLevel,
} from "@superior-ai/core";
import { modelRegistry } from "../registry/model-registry";

function scoreModel(m: ModelDefinition, req: RoutingRequest): number {
  let s = 0;
  const scores = m.scores;

  switch (req.taskType) {
    case "coding":
      s += scores.coding * 2 + scores.agentic * 1.5 + scores.toolUse;
      break;
    case "research":
      s += scores.research * 2 + scores.reasoning + (m.webAccess ? 20 : 0);
      break;
    case "financial":
    case "analysis":
    case "strategy":
      s += scores.reasoning * 2 + scores.mathematics + scores.writing;
      break;
    case "creative":
      s += scores.writing * 2 + scores.vision;
      break;
    case "multimodal":
      s += scores.vision * 2 + scores.audio + scores.video + (m.multimodalSupport ? 30 : -50);
      break;
    default:
      s += scores.reasoning + scores.writing;
  }

  if (req.costSensitivity === "high") s += scores.cost * 1.5;
  if (req.latencySensitivity === "high") s += scores.latency * 1.5;
  if (req.requiredReasoning) s += scores.reasoning;
  if (req.requiredTools.length) s += m.functionCalling ? scores.toolUse : -40;
  if (req.risk === "critical" || req.risk === "high") s += scores.reliability * 1.5;

  s += m.healthScore * 0.3;
  s += m.priority * 0.1;

  const levelBoost: Record<IntelligenceLevel, number> = {
    FAST: scores.latency * 0.5,
    BALANCED: 0,
    DEEP: scores.reasoning * 0.3,
    EXPERT: scores.reasoning * 0.5 + scores.agentic * 0.3,
    MAXIMUM: scores.reasoning * 0.7 + scores.agentic * 0.5,
    SUPREME: scores.reasoning * 1.0 + scores.agentic * 0.8 + scores.research * 0.5,
    AUTONOMOUS: scores.agentic * 0.8 + scores.toolUse * 0.4,
  };
  s += levelBoost[req.intelligenceLevel] ?? 0;

  return s;
}

export function route(request: RoutingRequest): RoutingDecision {
  const available = modelRegistry.list({ availableOnly: true });

  if (available.length === 0) {
    const local = modelRegistry.get("local:local-default");
    const any = modelRegistry.list().find((m) => m.status !== "UNAVAILABLE") ?? local;
    if (!any) {
      throw new Error("No models registered. Configure at least one provider in Admin → AI Providers.");
    }
    return {
      primary: any,
      fallback: [],
      reason: "No AVAILABLE models. Using best registered model. Activate providers via admin console.",
    };
  }

  const ranked = [...available].sort(
    (a, b) => scoreModel(b, request) - scoreModel(a, request)
  );

  const primary = ranked[0];
  const secondary = ranked[1];
  const critic = ranked.find((m) => m.id !== primary.id && m.scores.reasoning >= 80) ?? ranked[2];
  const factCheck = ranked.find(
    (m) => m.id !== primary.id && m.webAccess && m.scores.research >= 70
  );
  const executor = ranked.find((m) => m.scores.coding >= 85 || m.scores.agentic >= 85) ?? primary;

  const fallback = ranked.slice(1, 6);
  const emergency = available.find((m) => m.provider === "local") ?? ranked[ranked.length - 1];

  let reason = `Selected ${primary.displayName} as primary for ${request.taskType} (intelligence=${request.intelligenceLevel}).`;
  if (secondary) reason += ` Secondary: ${secondary.displayName}.`;
  if (critic) reason += ` Critic: ${critic.displayName}.`;

  return {
    primary,
    secondary,
    critic,
    factCheck,
    executor,
    fallback,
    emergency,
    reason,
  };
}

export function selectForRole(
  role: "primary" | "critic" | "coder" | "researcher" | "fast",
  request: RoutingRequest
): ModelDefinition | null {
  const decision = route(request);
  switch (role) {
    case "primary":
      return decision.primary;
    case "critic":
      return decision.critic ?? decision.secondary ?? decision.primary;
    case "coder":
      return decision.executor ?? decision.primary;
    case "researcher":
      return decision.factCheck ?? decision.primary;
    case "fast":
      return (
        modelRegistry
          .list({ availableOnly: true })
          .sort((a, b) => b.scores.latency - a.scores.latency)[0] ?? decision.primary
      );
    default:
      return decision.primary;
  }
}
