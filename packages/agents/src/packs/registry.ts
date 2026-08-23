/**
 * Agent Pack Marketplace foundation
 * Packs are versioned bundles of specialist agents + workflows + tools permissions.
 * Install = register into org; does not download untrusted code at runtime.
 */

import { signPackHs256, verifyPackSignature, type SignedPackManifest } from "./signing";

export type PackCategory =
  | "growth"
  | "engineering"
  | "finance"
  | "legal"
  | "support"
  | "research"
  | "creative"
  | "operations";

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
    description: "Research → strategy → creative → SEO → sales loop for small business GTM.",
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
    description: "Repo inspect, plan, implement, test, PR workflow with human approval gates.",
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
    description: "Budget checks, cost attribution summaries, scenario notes (not investment advice).",
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

export function listCatalog(filter?: { category?: PackCategory }): AgentPackManifest[] {
  if (!filter?.category) return [...CATALOG];
  return CATALOG.filter((p) => p.category === filter.category);
}

export function getPack(id: string): AgentPackManifest | undefined {
  return CATALOG.find((p) => p.id === id);
}

export function installPack(input: {
  packId: string;
  organizationId: string;
}): { ok: boolean; error?: string; installed?: InstalledPack } {
  const pack = getPack(input.packId);
  if (!pack) return { ok: false, error: "Pack not found" };
  if (!pack.verified) return { ok: false, error: "Only verified packs can be installed" };

  const existing = installed.find(
    (i) => i.packId === input.packId && i.organizationId === input.organizationId
  );
  if (existing) {
    existing.enabled = true;
    existing.version = pack.version;
    return { ok: true, installed: existing };
  }

  const row: InstalledPack = {
    packId: pack.id,
    version: pack.version,
    organizationId: input.organizationId,
    installedAt: new Date().toISOString(),
    enabled: true,
  };
  installed.push(row);
  return { ok: true, installed: row };
}

export function uninstallPack(packId: string, organizationId: string): boolean {
  const idx = installed.findIndex((i) => i.packId === packId && i.organizationId === organizationId);
  if (idx === -1) return false;
  installed.splice(idx, 1);
  return true;
}

export function listInstalled(organizationId: string): Array<InstalledPack & { manifest?: AgentPackManifest }> {
  return installed
    .filter((i) => i.organizationId === organizationId)
    .map((i) => ({ ...i, manifest: getPack(i.packId) }));
}

export function isPackEnabled(organizationId: string, packId: string): boolean {
  return installed.some((i) => i.organizationId === organizationId && i.packId === packId && i.enabled);
}


/** Third-party / published packs (must verify signature on install) */
const published: SignedPackManifest[] = [];

export function publishPack(pack: AgentPackManifest, opts?: { usePlatformSign?: boolean }): SignedPackManifest {
  const signed = signPackHs256({ ...pack, verified: opts?.usePlatformSign !== false ? pack.verified : false });
  const idx = published.findIndex((p) => p.id === signed.id && p.version === signed.version);
  if (idx >= 0) published[idx] = signed;
  else published.push(signed);
  return signed;
}

export function listPublished(): SignedPackManifest[] {
  return [...published];
}

export function installPackVerified(input: {
  packId: string;
  organizationId: string;
  signed?: SignedPackManifest;
}): { ok: boolean; error?: string; installed?: InstalledPack } {
  const fromCatalog = getPack(input.packId);
  const fromPublished = published.find((p) => p.id === input.packId);
  const signed = input.signed ?? fromPublished;

  if (signed) {
    const v = verifyPackSignature(signed);
    if (!v.valid) {
      return { ok: false, error: `Signature invalid: ${v.error}` };
    }
  } else if (!fromCatalog?.verified) {
    return { ok: false, error: "Pack must be platform-verified or carry a valid signature" };
  }

  return installPack({ packId: input.packId, organizationId: input.organizationId });
}
