/**
 * Persistent Memory Engine — actionable, typed, correctable
 * Layers from the God-Mode addendum; retrieval is relevance-ranked, not full dump.
 */

import { MemoryStore, type MemoryItem, type MemoryLayer } from "./layers";

export type PersistentMemoryType =
  | "conversation"
  | "user"
  | "project"
  | "company"
  | "customer"
  | "product"
  | "market"
  | "competitor"
  | "campaign"
  | "creative"
  | "codebase"
  | "research"
  | "decision"
  | "workflow"
  | "agent"
  | "preference"
  | "rejection" // actionable: rejected approaches
  | "success"
  | "failure"
  | "cx"
  | "support";

export interface PersistentRecord {
  id: string;
  type: PersistentMemoryType;
  key?: string; // stable key for updates e.g. preference.writing_style
  content: string;
  importance: number;
  projectId?: string;
  customerId?: string;
  organizationId?: string;
  profileId?: string; // local workspace profile
  tags: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

const store: PersistentRecord[] = [];
const MAX = 20_000;

function id() {
  return `pm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function remember(input: {
  type: PersistentMemoryType;
  content: string;
  key?: string;
  importance?: number;
  projectId?: string;
  customerId?: string;
  organizationId?: string;
  profileId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}): PersistentRecord {
  // Update-by-key if provided
  if (input.key) {
    const existing = store.find(
      (r) =>
        r.key === input.key &&
        r.active &&
        r.profileId === input.profileId &&
        r.organizationId === input.organizationId
    );
    if (existing) {
      existing.content = input.content;
      existing.importance = input.importance ?? existing.importance;
      existing.tags = input.tags ?? existing.tags;
      existing.metadata = { ...existing.metadata, ...input.metadata };
      existing.updatedAt = new Date().toISOString();
      return existing;
    }
  }

  const rec: PersistentRecord = {
    id: id(),
    type: input.type,
    key: input.key,
    content: input.content,
    importance: input.importance ?? 50,
    projectId: input.projectId,
    customerId: input.customerId,
    organizationId: input.organizationId,
    profileId: input.profileId,
    tags: input.tags ?? [],
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: input.metadata,
  };
  store.push(rec);
  if (store.length > MAX) store.shift();
  return rec;
}

export function forget(input: {
  id?: string;
  key?: string;
  contentContains?: string;
  profileId?: string;
}): { forgotten: number } {
  let n = 0;
  for (const r of store) {
    if (!r.active) continue;
    if (input.profileId && r.profileId !== input.profileId) continue;
    if (input.id && r.id === input.id) {
      r.active = false;
      r.updatedAt = new Date().toISOString();
      n++;
    } else if (input.key && r.key === input.key) {
      r.active = false;
      r.updatedAt = new Date().toISOString();
      n++;
    } else if (
      input.contentContains &&
      r.content.toLowerCase().includes(input.contentContains.toLowerCase())
    ) {
      r.active = false;
      r.updatedAt = new Date().toISOString();
      n++;
    }
  }
  return { forgotten: n };
}

export function updateMemory(
  idOrKey: string,
  content: string,
  opts?: { profileId?: string }
): PersistentRecord | null {
  const r =
    store.find((x) => x.id === idOrKey && x.active) ||
    store.find(
      (x) =>
        x.key === idOrKey &&
        x.active &&
        (!opts?.profileId || x.profileId === opts.profileId)
    );
  if (!r) return null;
  r.content = content;
  r.updatedAt = new Date().toISOString();
  return r;
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((t) => t.length > 2);
}

/** Intelligent retrieval — relevance + recency + importance, not full dump */
export function retrieveRelevant(input: {
  query: string;
  types?: PersistentMemoryType[];
  projectId?: string;
  customerId?: string;
  profileId?: string;
  organizationId?: string;
  limit?: number;
}): PersistentRecord[] {
  const qTokens = tokenize(input.query);
  const limit = input.limit ?? 12;
  const scored: Array<{ r: PersistentRecord; score: number }> = [];

  for (const r of store) {
    if (!r.active) continue;
    if (input.types && !input.types.includes(r.type)) continue;
    if (input.projectId && r.projectId && r.projectId !== input.projectId) continue;
    if (input.customerId && r.customerId && r.customerId !== input.customerId) continue;
    if (input.profileId && r.profileId && r.profileId !== input.profileId) continue;
    if (input.organizationId && r.organizationId && r.organizationId !== input.organizationId)
      continue;

    const tokens = tokenize(r.content + " " + r.tags.join(" ") + " " + (r.key ?? ""));
    let overlap = 0;
    for (const t of qTokens) {
      if (tokens.includes(t) || r.content.toLowerCase().includes(t)) overlap++;
    }
    if (qTokens.length && overlap === 0 && r.importance < 80) continue;

    const recency =
      1 /
      (1 + (Date.now() - new Date(r.updatedAt).getTime()) / (1000 * 60 * 60 * 24 * 7));
    const score =
      (overlap / Math.max(1, qTokens.length)) * 40 +
      r.importance * 0.4 +
      recency * 20 +
      (r.type === "rejection" || r.type === "preference" ? 10 : 0);

    scored.push({ r, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.r);
}

/** Actionable: rejected approaches to avoid re-recommending */
export function getRejections(profileId?: string): string[] {
  return store
    .filter((r) => r.active && r.type === "rejection" && (!profileId || r.profileId === profileId))
    .map((r) => r.content);
}

export function listMemory(filter?: {
  type?: PersistentMemoryType;
  profileId?: string;
  activeOnly?: boolean;
}): PersistentRecord[] {
  return store
    .filter((r) => {
      if (filter?.activeOnly !== false && !r.active) return false;
      if (filter?.type && r.type !== filter.type) return false;
      if (filter?.profileId && r.profileId !== filter.profileId) return false;
      return true;
    })
    .slice(-200)
    .reverse();
}

export function memoryStats(): { total: number; active: number; byType: Record<string, number> } {
  const byType: Record<string, number> = {};
  let active = 0;
  for (const r of store) {
    if (r.active) {
      active++;
      byType[r.type] = (byType[r.type] ?? 0) + 1;
    }
  }
  return { total: store.length, active, byType };
}

/** Format for agent context — compact, not full dump */
export function formatMemoryForPrompt(records: PersistentRecord[]): string {
  if (!records.length) return "";
  const lines = records.map(
    (r) =>
      `- [${r.type}${r.key ? `:${r.key}` : ""}] ${r.content.slice(0, 300)}${r.content.length > 300 ? "…" : ""}`
  );
  return `## Relevant memory\n${lines.join("\n")}\n\nRespect rejections and preferences above when recommending approaches.`;
}
