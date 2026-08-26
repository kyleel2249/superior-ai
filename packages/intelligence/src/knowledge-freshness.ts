/**
 * Knowledge freshness scoring for KG entities
 */

import { getEntity, upsertEntity, listEntities, type KgEntity } from "./knowledge-graph";

export function computeFreshness(updatedAt: string, halfLifeDays = 30): number {
  const ageMs = Date.now() - new Date(updatedAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  const score = Math.exp(-ageDays / halfLifeDays);
  return Math.round(score * 1000) / 1000;
}

export function refreshEntityFreshness(id: string): KgEntity | undefined {
  const e = getEntity(id);
  if (!e) return undefined;
  return upsertEntity({
    ...e,
    freshnessScore: computeFreshness(e.updatedAt),
  });
}

export function staleEntities(threshold = 0.4): KgEntity[] {
  return listEntities(500).filter((e) => {
    const f = e.freshnessScore ?? computeFreshness(e.updatedAt);
    return f < threshold;
  });
}
