/**
 * Multi-layer memory with quality controls
 * SHORT-TERM | PROJECT | USER | ORGANIZATION | KNOWLEDGE
 */

export type MemoryLayer = "short_term" | "project" | "user" | "organization" | "knowledge";

export interface MemoryItem {
  id: string;
  layer: MemoryLayer;
  content: string;
  source?: string;
  importance: number; // 0-100
  trust: number; // 0-100
  createdAt: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

export interface MemoryQuery {
  text: string;
  layers?: MemoryLayer[];
  limit?: number;
  minImportance?: number;
}

export interface RankedMemory extends MemoryItem {
  relevance: number;
  score: number;
}

/** In-memory store for foundation; swap for Postgres + pgvector in production */
export class MemoryStore {
  private items: MemoryItem[] = [];

  add(item: Omit<MemoryItem, "id" | "createdAt"> & { id?: string }): MemoryItem {
    const full: MemoryItem = {
      ...item,
      id: item.id ?? `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    };
    this.items.push(full);
    return full;
  }

  /** Simple lexical relevance + importance + trust + recency */
  search(query: MemoryQuery): RankedMemory[] {
    const terms = query.text.toLowerCase().split(/\W+/).filter((t) => t.length > 2);
    const layers = query.layers;
    const limit = query.limit ?? 8;
    const minImp = query.minImportance ?? 0;

    const ranked: RankedMemory[] = [];
    for (const item of this.items) {
      if (layers && !layers.includes(item.layer)) continue;
      if (item.importance < minImp) continue;
      if (item.expiresAt && new Date(item.expiresAt) < new Date()) continue;

      const contentLower = item.content.toLowerCase();
      let hits = 0;
      for (const t of terms) {
        if (contentLower.includes(t)) hits++;
      }
      const relevance = terms.length ? hits / terms.length : 0;
      if (relevance === 0 && terms.length > 0) continue;

      const ageHours = (Date.now() - new Date(item.createdAt).getTime()) / 3600000;
      const recency = Math.max(0, 1 - ageHours / (24 * 30)); // decay over ~30 days
      const score = relevance * 40 + item.importance * 0.3 + item.trust * 0.2 + recency * 10;

      ranked.push({ ...item, relevance, score });
    }

    ranked.sort((a, b) => b.score - a.score);
    return ranked.slice(0, limit);
  }

  /** Detect conflicting statements (naive) */
  detectConflicts(items: MemoryItem[]): Array<{ a: MemoryItem; b: MemoryItem; note: string }> {
    const conflicts: Array<{ a: MemoryItem; b: MemoryItem; note: string }> = [];
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i]!;
        const b = items[j]!;
        // Very lightweight: opposite sentiment keywords on same topic words
        const neg = /\b(not|never|no longer|false|incorrect)\b/i;
        if (neg.test(a.content) !== neg.test(b.content) && a.content.slice(0, 40) === b.content.slice(0, 40)) {
          conflicts.push({
            a,
            b,
            note: "Possible conflict — review sources before treating as fact",
          });
        }
      }
    }
    return conflicts;
  }

  summarizeForContext(query: string, maxChars = 3000): string {
    const hits = this.search({ text: query, limit: 10 });
    if (!hits.length) return "";
    const parts = hits.map(
      (h) =>
        `[${h.layer}|imp=${h.importance}|trust=${h.trust}] ${h.content.slice(0, 400)}${h.source ? ` (source: ${h.source})` : ""}`
    );
    let out = parts.join("\n---\n");
    if (out.length > maxChars) out = out.slice(0, maxChars) + "\n…[compressed]";
    return out;
  }
}

export const globalMemory = new MemoryStore();
