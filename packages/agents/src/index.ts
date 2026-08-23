export * from "./packs/registry";
export * from "./packs/ranking";
export * from "./packs/signing";
export * from "./packs/semantic-search";
export * from "./packs/publish";
export * from "./factory/tasks";
export * from "./orchestrator/run";
export * from "./tools/url-audit";

import { listCatalog, type PackCategory, type AgentPackManifest } from "./packs/registry";

/**
 * NOTE (repo audit): this file previously did not exist. `full-council.ts`
 * imported ALL_DEPARTMENTS / selectAgentsForGrowthTask / buildCompanyOrgChart
 * from a sibling `../index` that was never created, and its own comment said
 * "see local monorepo for complete source" — i.e. it was a stub with no real
 * implementation behind it. What follows is a real, minimal implementation
 * derived from the existing pack registry, not a restored original. Treat it
 * as a first pass, not a recovered feature — flesh it out in a later phase
 * if you need richer department/org-chart behavior.
 */

export const ALL_DEPARTMENTS: PackCategory[] = [
  "growth",
  "engineering",
  "finance",
  "legal",
  "support",
  "research",
  "creative",
  "operations",
];

const STOPWORDS = new Set([
  "a", "an", "the", "for", "our", "your", "and", "or", "of", "to", "in", "on",
  "with", "is", "are", "be", "we", "us", "it", "this", "that", "at", "by",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

export function selectAgentsForGrowthTask(task: string): string[] {
  const packs = listCatalog({ category: "growth" });
  const taskTokens = tokenize(task);
  const matched = packs.filter((p) => {
    const descTokens = new Set(tokenize(p.description));
    return taskTokens.some((w) => descTokens.has(w));
  });
  const source = matched.length > 0 ? matched : packs;
  return Array.from(new Set(source.flatMap((p) => p.agents)));
}

export interface OrgChartNode {
  department: PackCategory;
  packs: AgentPackManifest[];
  agents: string[];
}

export function buildCompanyOrgChart(): OrgChartNode[] {
  return ALL_DEPARTMENTS.map((department) => {
    const packs = listCatalog({ category: department });
    return {
      department,
      packs,
      agents: Array.from(new Set(packs.flatMap((p) => p.agents))),
    };
  });
}
