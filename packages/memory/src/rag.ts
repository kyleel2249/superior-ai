/**
 * Hybrid RAG: vector (when embeddings available) + lexical fallback.
 * pgvector persistence via migration 003 when DATABASE_URL is set.
 */

import { embedText, cosineSimilarity } from "./embeddings";
import { globalMemory } from "./layers";
import { indexDocuments, vectorSearch, vectorStoreStats } from "./indexer";

export interface RagHit {
  id: string;
  title: string;
  content: string;
  source?: string;
  score: number;
  method: "vector" | "lexical" | "hybrid";
}

export async function hybridRetrieve(
  query: string,
  opts: { limit?: number; minScore?: number } = {}
): Promise<{ hits: RagHit[]; stats: ReturnType<typeof vectorStoreStats> }> {
  const limit = opts.limit ?? 6;
  const minScore = opts.minScore ?? 0.15;
  const vectorHits = await vectorSearch(query, limit * 2);
  const lexical = globalMemory.search({ text: query, limit: limit * 2 });

  const byId = new Map<string, RagHit>();
  for (const v of vectorHits) {
    if (v.score < minScore) continue;
    byId.set(v.id, {
      id: v.id,
      title: v.title,
      content: v.content,
      source: v.source,
      score: v.score,
      method: "vector",
    });
  }
  for (const l of lexical) {
    const existing = byId.get(l.id);
    if (existing) {
      existing.score = Math.min(1, existing.score * 0.6 + l.score * 0.4);
      existing.method = "hybrid";
    } else {
      byId.set(l.id, {
        id: l.id,
        title: String(l.metadata?.title ?? "memory"),
        content: l.content,
        source: l.source,
        score: l.score,
        method: "lexical",
      });
    }
  }

  const hits = [...byId.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return { hits, stats: vectorStoreStats() };
}

export async function ingestKnowledge(
  docs: Array<{ title: string; content: string; source?: string }>
) {
  return indexDocuments(docs);
}

export function ragStatus() {
  return {
    ...vectorStoreStats(),
    embeddingHint:
      "Set OPENAI_API_KEY or OPENROUTER_API_KEY for embeddings. Apply migrations/003_vector_embeddings.sql for pgvector.",
  };
}

export { indexDocuments, vectorSearch, vectorStoreStats };
