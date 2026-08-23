export type PackCategory =
  | "growth" | "engineering" | "finance" | "legal" | "support" | "research" | "creative" | "operations";

export interface AgentPackManifest {
  id: string;
  name: string;
  version: string;
  category: PackCategory;
  description: string;
  agents: string[];
  workflows: string[];
  requiredTools: string[];
  requiredPermissions: string[];
  author: string;
  verified: boolean;
  pricing: "included" | "add_on" | "enterprise";
}

export interface InstalledPack {
  packId: string;
  version: string;
  organizationId: string;
  installedAt: string;
  enabled: boolean;
}

const CATALOG: AgentPackManifest[] = [
  {
    id: "pack.growth.smb",
    name: "SMB Growth Engine",
    version: "1.0.0",
    category: "growth",
    description: "Research → strategy → creative → SEO → sales loop for SMB GTM.",
    agents: ["Research Agent", "CMO Agent", "Creative Agent", "SEO Agent", "Sales Agent"],
    workflows: ["growth_loop", "campaign_from_oneliner"],
    requiredTools: ["web_search", "url_audit"],
    requiredPermissions: ["run_orchestrator"],
    author: "SUPERIOR AI",
    verified: true,
    pricing: "included",
  },
  {
    id: "pack.engineering.ship",
    name: "Software Factory",
    version: "1.0.0",
    category: "engineering",
    description: "Repo inspect, plan, implement, test, PR with human approval gates.",
    agents: ["CTO Agent", "Coding Agent", "Reviewer Agent", "QA Agent"],
    workflows: ["software_factory", "repo_audit"],
    requiredTools: ["repo_inspect", "code_exec"],
    requiredPermissions: ["run_orchestrator", "write"],
    author: "SUPERIOR AI",
    verified: true,
    pricing: "included",
  },
  {
    id: "pack.creative.studio",
    name: "Creative Studio Pro",
    version: "1.0.0",
    category: "creative",
    description: "UGC scripts, storyboards, image/video plans with continuity locks.",
    agents: ["Creative Agent", "Story Director", "Brand Agent"],
    workflows: ["ugc_campaign", "storyboard"],
    requiredTools: ["image_gen"],
    requiredPermissions: ["run_orchestrator"],
    author: "SUPERIOR AI",
    verified: true,
    pricing: "add_on",
  },
  {
    id: "pack.finance.ops",
    name: "Finance Analyst Desk",
    version: "1.0.0",
    category: "finance",
    description: "Budget checks and cost attribution summaries (not investment advice).",
    agents: ["CFO Agent", "Risk Agent", "Analyst Agent"],
    workflows: ["budget_review", "cost_attribution"],
    requiredTools: [],
    requiredPermissions: ["billing", "read"],
    author: "SUPERIOR AI",
    verified: true,
    pricing: "enterprise",
  },
  {
    id: "pack.support.success",
    name: "Customer Success Desk",
    version: "0.9.0",
    category: "support",
    description: "Ticket triage patterns, retention playbooks, escalation criteria.",
    agents: ["Support Agent", "Customer Agent", "Operations Agent"],
    workflows: ["triage", "retention_loop"],
    requiredTools: [],
    requiredPermissions: ["read", "write"],
    author: "SUPERIOR AI",
    verified: true,
    pricing: "add_on",
  },
];

const installed: InstalledPack[] = [];

export function listCatalog(filter?: { category?: PackCategory }) {
  if (!filter?.category) return [...CATALOG];
  return CATALOG.filter((p) => p.category === filter.category);
}

export function getPack(id: string) {
  return CATALOG.find((p) => p.id === id);
}

export function installPack(input: { packId: string; organizationId: string }) {
  const pack = getPack(input.packId);
  if (!pack) return { ok: false as const, error: "Pack not found" };
  if (!pack.verified) return { ok: false as const, error: "Only verified packs can be installed" };
  const existing = installed.find((i) => i.packId === input.packId && i.organizationId === input.organizationId);
  if (existing) {
    existing.enabled = true;
    existing.version = pack.version;
    return { ok: true as const, installed: existing };
  }
  const row: InstalledPack = {
    packId: pack.id,
    version: pack.version,
    organizationId: input.organizationId,
    installedAt: new Date().toISOString(),
    enabled: true,
  };
  installed.push(row);
  return { ok: true as const, installed: row };
}

export function uninstallPack(packId: string, organizationId: string) {
  const idx = installed.findIndex((i) => i.packId === packId && i.organizationId === organizationId);
  if (idx === -1) return false;
  installed.splice(idx, 1);
  return true;
}

export function listInstalled(organizationId: string) {
  return installed
    .filter((i) => i.organizationId === organizationId)
    .map((i) => ({ ...i, manifest: getPack(i.packId) }));
}

export function isPackEnabled(organizationId: string, packId: string) {
  return installed.some((i) => i.organizationId === organizationId && i.packId === packId && i.enabled);
}

/** Used by publishPack() to add a signed, published pack to the installable catalog. */
export function registerCustomPack(pack: AgentPackManifest): AgentPackManifest {
  const existingIdx = CATALOG.findIndex((p) => p.id === pack.id);
  if (existingIdx >= 0) CATALOG[existingIdx] = pack;
  else CATALOG.push(pack);
  return pack;
}
