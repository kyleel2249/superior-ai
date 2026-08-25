/**
 * AI Economics — cost, quality, ROI-style accounting from observed usage.
 */

export interface EconomicsEvent {
  id: string;
  at: string;
  department?: string;
  agent?: string;
  modelId?: string;
  taskType?: string;
  providerCostUsd: number;
  qualityScore?: number;
  latencyMs?: number;
  revenueInfluencedUsd?: number;
  humanHoursAvoided?: number;
}

const events: EconomicsEvent[] = [];

export function recordEconomics(e: Omit<EconomicsEvent, "id" | "at">): EconomicsEvent {
  const row: EconomicsEvent = {
    ...e,
    id: `eco_${Date.now().toString(36)}`,
    at: new Date().toISOString(),
  };
  events.push(row);
  if (events.length > 5000) events.shift();
  return row;
}

export function economicsRollup(filter?: { department?: string }) {
  let rows = events;
  if (filter?.department) rows = rows.filter((r) => r.department === filter.department);
  const providerCost = rows.reduce((s, r) => s + r.providerCostUsd, 0);
  const revenue = rows.reduce((s, r) => s + (r.revenueInfluencedUsd ?? 0), 0);
  const hours = rows.reduce((s, r) => s + (r.humanHoursAvoided ?? 0), 0);
  const withQ = rows.filter((r) => r.qualityScore != null);
  const avgQuality = withQ.length
    ? withQ.reduce((s, r) => s + (r.qualityScore ?? 0), 0) / withQ.length
    : null;
  const costPerTask = rows.length ? providerCost / rows.length : 0;
  const qualityPerDollar =
    providerCost > 0 && avgQuality != null ? avgQuality / providerCost : null;

  return {
    tasks: rows.length,
    providerCostUsd: Math.round(providerCost * 100) / 100,
    revenueInfluencedUsd: Math.round(revenue * 100) / 100,
    humanHoursAvoided: Math.round(hours * 10) / 10,
    avgQuality: avgQuality != null ? Math.round(avgQuality * 10) / 10 : null,
    costPerTaskUsd: Math.round(costPerTask * 10000) / 10000,
    qualityPerDollar,
    /** Labeled estimate using $75/hr proxy — configurable in future */
    estimatedLaborValueUsd: Math.round(hours * 75 * 100) / 100,
    note: "Labor value uses a $75/hr proxy for illustration; not a payroll guarantee.",
  };
}

export function listEconomics(limit = 100): EconomicsEvent[] {
  return [...events].reverse().slice(0, limit);
}
