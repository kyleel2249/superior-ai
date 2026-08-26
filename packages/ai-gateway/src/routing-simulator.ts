/**
 * Routing policy simulator — compare two intelligence levels on same text.
 */

import { classifyTask } from "./router/task-classifier";
import { route } from "./router/superior-router";
import type { IntelligenceLevel } from "@superior-ai/core";

export function simulateRoutingPolicies(
  text: string,
  policyA: IntelligenceLevel,
  policyB: IntelligenceLevel
) {
  const reqA = classifyTask(text, { intelligenceLevel: policyA });
  const reqB = classifyTask(text, { intelligenceLevel: policyB });
  const a = route(reqA);
  const b = route(reqB);
  return {
    text: text.slice(0, 200),
    policyA: {
      level: policyA,
      primary: a.primary.displayName,
      reason: a.reason,
    },
    policyB: {
      level: policyB,
      primary: b.primary.displayName,
      reason: b.reason,
    },
    samePrimary: a.primary.id === b.primary.id,
    note: "Simulation uses registry scoring only; provider latency/cost not measured live.",
  };
}
