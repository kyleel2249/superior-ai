/**
 * Cost attribution — by org, project, user, model, meter
 */

import { summarizeUsage, type MeterType } from "./meters";

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

/** Aggregate from meter events already recorded in-process */
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

export function attributionReport(filter: AttributionFilter = {}): {
  totalCostUsd: number;
  byMeter: CostBreakdownRow[];
  byModel: CostBreakdownRow[];
  byProvider: CostBreakdownRow[];
  byProject: Array<{ projectId: string; costUsd: number; share: number }>;
  byUser: Array<{ userId: string; costUsd: number; share: number }>;
} {
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
  const totalCostUsd = Math.max(meterTotal, modelTotal) || meterTotal + modelTotal;

  const byMeter: CostBreakdownRow[] = Object.entries(usage).map(([key, v]) => ({
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

  const toRows = (
    map: Map<string, number>,
    dimension: "model" | "provider"
  ): CostBreakdownRow[] =>
    Array.from(map.entries())
      .map(([key, costUsd]) => ({
        key,
        dimension,
        quantity: 0,
        costUsd,
        share: totalCostUsd > 0 ? costUsd / totalCostUsd : 0,
      }))
      .sort((a, b) => b.costUsd - a.costUsd);

  const mapShare = (map: Map<string, number>, idKey: "projectId" | "userId") =>
    Array.from(map.entries())
      .map(([id, costUsd]) => ({
        [idKey]: id,
        costUsd,
        share: totalCostUsd > 0 ? costUsd / totalCostUsd : 0,
      }))
      .sort((a, b) => b.costUsd - a.costUsd) as Array<{
      projectId: string;
      userId: string;
      costUsd: number;
      share: number;
    }>;

  return {
    totalCostUsd,
    byMeter: byMeter.sort((a, b) => b.costUsd - a.costUsd),
    byModel: toRows(modelMap, "model"),
    byProvider: toRows(providerMap, "provider"),
    byProject: mapShare(projectMap, "projectId").map((r) => ({
      projectId: r.projectId,
      costUsd: r.costUsd,
      share: r.share,
    })),
    byUser: mapShare(userMap, "userId").map((r) => ({
      userId: r.userId,
      costUsd: r.costUsd,
      share: r.share,
    })),
  };
}
