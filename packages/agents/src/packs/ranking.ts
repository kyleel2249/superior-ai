/**
 * Marketplace ranking for agent packs
 * Score = weighted blend of verification, installs, recency, rating, pricing fit
 */

import type { AgentPackManifest } from "./registry";
import { listCatalog, listInstalled, getPack } from "./registry";

export interface PackMetrics {
  packId: string;
  installs: number;
  ratingSum: number;
  ratingCount: number;
  lastInstallAt?: string;
  featured?: boolean;
}

export interface RankedPack extends AgentPackManifest {
  score: number;
  rank: number;
  metrics: {
    installs: number;
    ratingAvg: number | null;
    ratingCount: number;
    verifiedBoost: number;
    featuredBoost: number;
    recencyBoost: number;
  };
  reasons: string[];
}

const metricsStore = new Map<string, PackMetrics>();

export function recordPackInstall(packId: string): void {
  const m = metricsStore.get(packId) ?? {
    packId,
    installs: 0,
    ratingSum: 0,
    ratingCount: 0,
  };
  m.installs += 1;
  m.lastInstallAt = new Date().toISOString();
  metricsStore.set(packId, m);
}

export function ratePack(packId: string, stars: number): { ok: boolean; error?: string } {
  if (stars < 1 || stars > 5) return { ok: false, error: "stars must be 1-5" };
  if (!getPack(packId) && !metricsStore.has(packId)) {
    // allow rating known metrics-only; prefer catalog
  }
  const m = metricsStore.get(packId) ?? {
    packId,
    installs: 0,
    ratingSum: 0,
    ratingCount: 0,
  };
  m.ratingSum += stars;
  m.ratingCount += 1;
  metricsStore.set(packId, m);
  return { ok: true };
}

export function setFeatured(packId: string, featured: boolean): void {
  const m = metricsStore.get(packId) ?? {
    packId,
    installs: 0,
    ratingSum: 0,
    ratingCount: 0,
  };
  m.featured = featured;
  metricsStore.set(packId, m);
}

export function getPackMetrics(packId: string): PackMetrics {
  return (
    metricsStore.get(packId) ?? {
      packId,
      installs: 0,
      ratingSum: 0,
      ratingCount: 0,
    }
  );
}

function daysSince(iso?: string): number {
  if (!iso) return 365;
  return Math.max(0, (Date.now() - new Date(iso).getTime()) / 86_400_000);
}

/**
 * Ranking weights (tunable):
 * - verified: +25
 * - featured: +15
 * - installs: log1p(installs) * 8
 * - rating: (avg/5) * 20 if count >= 3 else * 8
 * - recency: max(0, 10 - daysSince/7)
 * - included pricing slight boost for discovery: +3
 */
export function scorePack(pack: AgentPackManifest): {
  score: number;
  metrics: RankedPack["metrics"];
  reasons: string[];
} {
  const m = getPackMetrics(pack.id);
  const reasons: string[] = [];

  const verifiedBoost = pack.verified ? 25 : 0;
  if (pack.verified) reasons.push("verified publisher/platform pack");

  const featuredBoost = m.featured ? 15 : 0;
  if (m.featured) reasons.push("featured");

  const installScore = Math.log1p(m.installs) * 8;
  if (m.installs > 0) reasons.push(`${m.installs} installs`);

  const ratingAvg = m.ratingCount > 0 ? m.ratingSum / m.ratingCount : null;
  const ratingScore =
    ratingAvg == null ? 0 : (ratingAvg / 5) * (m.ratingCount >= 3 ? 20 : 8);
  if (ratingAvg != null) reasons.push(`rating ${ratingAvg.toFixed(1)} (${m.ratingCount})`);

  const recencyBoost = Math.max(0, 10 - daysSince(m.lastInstallAt) / 7);
  if (recencyBoost > 5) reasons.push("recently active");

  const pricingBoost = pack.pricing === "included" ? 3 : pack.pricing === "add_on" ? 1 : 0;

  const score =
    Math.round(
      (verifiedBoost + featuredBoost + installScore + ratingScore + recencyBoost + pricingBoost) * 100
    ) / 100;

  return {
    score,
    metrics: {
      installs: m.installs,
      ratingAvg,
      ratingCount: m.ratingCount,
      verifiedBoost,
      featuredBoost,
      recencyBoost: Math.round(recencyBoost * 100) / 100,
    },
    reasons,
  };
}

export function rankCatalog(filter?: {
  category?: string;
  organizationId?: string;
  limit?: number;
}): RankedPack[] {
  let packs = listCatalog(
    filter?.category ? { category: filter.category as never } : undefined
  );

  const ranked: RankedPack[] = packs.map((pack) => {
    const { score, metrics, reasons } = scorePack(pack);
    return { ...pack, score, rank: 0, metrics, reasons };
  });

  ranked.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  ranked.forEach((p, i) => {
    p.rank = i + 1;
  });

  const limit = filter?.limit ?? 50;
  return ranked.slice(0, limit);
}

/** Seed metrics from current in-memory installs for an org (best-effort) */
export function syncInstallMetricsFromOrg(organizationId: string): void {
  for (const row of listInstalled(organizationId)) {
    const m = getPackMetrics(row.packId);
    if (m.installs === 0) {
      recordPackInstall(row.packId);
    }
  }
}
