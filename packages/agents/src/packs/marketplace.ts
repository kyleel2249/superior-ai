/**
 * Agent marketplace — browse, install, rate, disable
 */

import {
  listCatalog,
  getPack,
  installPack,
  type AgentPackManifest,
} from "./registry";

export interface MarketplaceListing extends AgentPackManifest {
  installs: number;
  rating: number;
  ratingCount: number;
  featured?: boolean;
}

const ratings = new Map<string, { sum: number; count: number }>();
const installCounts = new Map<string, number>();
const disabled = new Set<string>();

export function listMarketplace(filter?: {
  category?: string;
  q?: string;
}): MarketplaceListing[] {
  let packs = listCatalog(
    filter?.category
      ? { category: filter.category as AgentPackManifest["category"] }
      : undefined
  );
  if (filter?.q) {
    const q = filter.q.toLowerCase();
    packs = packs.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.id.includes(q)
    );
  }
  return packs
    .filter((p) => !disabled.has(p.id))
    .map((p) => {
      const r = ratings.get(p.id);
      return {
        ...p,
        installs: installCounts.get(p.id) ?? 0,
        rating: r && r.count ? Math.round((r.sum / r.count) * 10) / 10 : 0,
        ratingCount: r?.count ?? 0,
        featured: p.verified,
      };
    })
    .sort((a, b) => b.rating - a.rating || b.installs - a.installs);
}

export function installFromMarketplace(packId: string, organizationId = "local") {
  const pack = getPack(packId);
  if (!pack) throw new Error(`Pack not found: ${packId}`);
  if (disabled.has(packId)) throw new Error(`Pack disabled: ${packId}`);
  const result = installPack({ packId, organizationId });
  installCounts.set(packId, (installCounts.get(packId) ?? 0) + 1);
  return result;
}

export function rateMarketplacePack(packId: string, stars: number): void {
  const s = Math.max(1, Math.min(5, stars));
  const cur = ratings.get(packId) ?? { sum: 0, count: 0 };
  cur.sum += s;
  cur.count += 1;
  ratings.set(packId, cur);
}

export function disablePack(packId: string): void {
  disabled.add(packId);
}

export function enablePack(packId: string): void {
  disabled.delete(packId);
}

export function marketplaceStats() {
  return {
    listings: listMarketplace().length,
    disabled: disabled.size,
    totalInstalls: [...installCounts.values()].reduce((a, b) => a + b, 0),
  };
}
