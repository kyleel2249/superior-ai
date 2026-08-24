/**
 * Memory conflict detection and correction helpers.
 */

import type { PersistentRecord } from "./persistent";

export interface MemoryConflict {
  a: PersistentRecord;
  b: PersistentRecord;
  reason: string;
}

const NEGATION =
  /\b(not|never|don't|do not|isn't|is not|wasn't|no longer|stop|avoid|rejected)\b/i;

export function detectMemoryConflicts(records: PersistentRecord[]): MemoryConflict[] {
  const active = records.filter((r) => r.active);
  const out: MemoryConflict[] = [];
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i]!;
      const b = active[j]!;
      if (a.type !== b.type && a.key !== b.key) continue;
      if (a.key && b.key && a.key === b.key && a.content !== b.content) {
        out.push({ a, b, reason: `Same key "${a.key}" with different content` });
        continue;
      }
      // shared significant tokens + opposing polarity
      const ta = a.content.toLowerCase().split(/\W+/).filter((t) => t.length > 3);
      const tb = new Set(b.content.toLowerCase().split(/\W+/).filter((t) => t.length > 3));
      const overlap = ta.filter((t) => tb.has(t)).length;
      if (overlap >= 3) {
        const aNeg = NEGATION.test(a.content);
        const bNeg = NEGATION.test(b.content);
        if (aNeg !== bNeg) {
          out.push({ a, b, reason: "Overlapping topic with opposing polarity" });
        }
      }
    }
  }
  return out;
}

/**
 * Prefer higher importance, then newer updatedAt when resolving same key.
 */
export function preferCanonical(a: PersistentRecord, b: PersistentRecord): PersistentRecord {
  if (a.importance !== b.importance) return a.importance >= b.importance ? a : b;
  return new Date(a.updatedAt) >= new Date(b.updatedAt) ? a : b;
}
