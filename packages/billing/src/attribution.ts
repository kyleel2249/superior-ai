import { summarizeUsage } from "./meters";

export interface AttributionFilter {
  organizationId?: string;
  since?: string;
}

export interface CostBreakdownRow {
  key: string;
  dimension: "meter" | "model" | "provider";
  quantity: number;
  costUsd: number;
  share: number;
}

const modelCosts: Array<{
  organizationId?: string;
  projectId?: string;
  userId?: string;
  modelId?: string;
  provider?: string;
  costUsd: number;
  tokens?: number;
  at: string;
}> = [];

export function recordModelCost(input: {
  organizationId?: string;
  projectId?: string;
  userId?: string;
  modelId?: string;
  provider?: string;
  costUsd: number;
  tokens?: number;
}): void {
  modelCosts.push({ ...input, at: new Date().toISOString() });
  if (modelCosts.length > 5000) modelCosts.shift();
}

export function attributionReport(filter: AttributionFilter = {}) {
  const usage = summarizeUsage({
    organizationId: filter.organizationId,
    since: filter.since,
  });
  const sinceMs = filter.since ? new Date(filter.since).getTime() : 0;
  const costs = modelCosts.filter((c) => {
    if (filter.organizationId && c.organizationId !== filter.organizationId) return false;
    if (new Date(c.at).getTime() < sinceMs) return false;
    return true;
  });
  const meterTotal = Object.values(usage).reduce((s, v) => s + v.costUsd, 0);
  const modelTotal = costs.reduce((s, c) => s + c.costUsd, 0);
  const totalCostUsd = meterTotal + modelTotal;
  const byMeter = Object.entries(usage).map(([key, v]) => ({
    key,
    dimension: "meter" as const,
    quantity: v.quantity,
    costUsd: v.costUsd,
    share: totalCostUsd > 0 ? v.costUsd / totalCostUsd : 0,
  }));
  const modelMap = new Map<string, number>();
  const providerMap = new Map<string, number>();
  const projectMap = new Map<string, number>();
  const userMap = new Map<string, number>();
  for (const c of costs) {
    if (c.modelId) modelMap.set(c.modelId, (modelMap.get(c.modelId) ?? 0) + c.costUsd);
    if (c.provider) providerMap.set(c.provider, (providerMap.get(c.provider) ?? 0) + c.costUsd);
    if (c.projectId) projectMap.set(c.projectId, (projectMap.get(c.projectId) ?? 0) + c.costUsd);
    if (c.userId) userMap.set(c.userId, (userMap.get(c.userId) ?? 0) + c.costUsd);
  }
  const toRows = (map: Map<string, number>, dimension: "model" | "provider") =>
    Array.from(map.entries())
      .map(([key, costUsd]) => ({
        key,
        dimension,
        quantity: 0,
        costUsd,
        share: totalCostUsd > 0 ? costUsd / totalCostUsd : 0,
      }))
      .sort((a, b) => b.costUsd - a.costUsd);
  return {
    totalCostUsd,
    byMeter: byMeter.sort((a, b) => b.costUsd - a.costUsd),
    byModel: toRows(modelMap, "model"),
    byProvider: toRows(providerMap, "provider"),
    byProject: Array.from(projectMap.entries()).map(([projectId, costUsd]) => ({
      projectId,
      costUsd,
      share: totalCostUsd > 0 ? costUsd / totalCostUsd : 0,
    })),
    byUser: Array.from(userMap.entries()).map(([userId, costUsd]) => ({
      userId,
      costUsd,
      share: totalCostUsd > 0 ? costUsd / totalCostUsd : 0,
    })),
  };
}
