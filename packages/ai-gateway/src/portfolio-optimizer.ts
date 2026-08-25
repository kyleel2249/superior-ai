/**
 * Model portfolio optimizer — recommend workload shifts from registry scores.
 */

import { modelRegistry } from "./registry/model-registry";
import { ensureCintexaRegistry } from "./registry/cintexa-models";

export interface PortfolioAdvice {
  increaseWorkload: string[];
  decreaseWorkload: string[];
  workerCandidates: string[];
  frontierCandidates: string[];
  redundantPairs: string[];
  notes: string[];
}

export function optimizePortfolio(): PortfolioAdvice {
  ensureCintexaRegistry();
  const models = modelRegistry
    .list()
    .filter((m) => m.metadata?.kind !== "product_tier" && m.status !== "DEPRECATED");

  const byValue = [...models].sort(
    (a, b) =>
      b.scores.reasoning +
      b.scores.coding +
      b.scores.cost -
      (a.scores.reasoning + a.scores.coding + a.scores.cost)
  );
  const workers = [...models]
    .filter((m) => m.scores.cost >= 70 && m.scores.latency >= 70)
    .map((m) => m.displayName);
  const frontier = [...models]
    .filter((m) => m.scores.reasoning >= 85)
    .map((m) => m.displayName);

  const increaseWorkload = byValue.slice(0, 3).map((m) => m.displayName);
  const decreaseWorkload = byValue
    .filter((m) => m.scores.cost < 40 && m.scores.reasoning < 80)
    .slice(0, 3)
    .map((m) => m.displayName);

  const redundantPairs: string[] = [];
  for (let i = 0; i < models.length; i++) {
    for (let j = i + 1; j < models.length; j++) {
      const a = models[i]!;
      const b = models[j]!;
      if (
        a.metadata?.underlyingProvider === b.metadata?.underlyingProvider &&
        Math.abs(a.scores.reasoning - b.scores.reasoning) < 5 &&
        Math.abs(a.scores.cost - b.scores.cost) < 5
      ) {
        redundantPairs.push(`${a.displayName} ~ ${b.displayName}`);
      }
    }
  }

  return {
    increaseWorkload,
    decreaseWorkload,
    workerCandidates: workers.slice(0, 5),
    frontierCandidates: frontier.slice(0, 5),
    redundantPairs: redundantPairs.slice(0, 5),
    notes: [
      "Based on registry capability scores, not live production traffic",
      "Validate with canary before shifting production share",
    ],
  };
}
