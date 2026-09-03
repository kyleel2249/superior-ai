/**
 * Embedding indexer — chunks docs, embeds when API available, stores vectors in-memory
 * Ready for pgvector persistence when DATABASE_URL + migration applied.
 */

import { embedText, cosineSimilarity } from "./embeddings";
import { globalMemory } from "./layers";

interface IndexedChunk {
  id: string;
  title: string;
  content: string;
  source?: string;
  vector?: number[];
  model?: string;
}

const vectorStore: IndexedChunk[] = [];

export async function indexDocuments(
  docs: Array<{ title: string; content: string; source?: string }>
): Promise<{ chunks: number; embedded: number }> {
  let chunks = 0;
  let embedded = 0;
  const chunkSize = 600;

  for (const doc of docs) {
    for (let i = 0; i < doc.content.length; i += chunkSize) {
      const content = doc.content.slice(i, i + chunkSize);
      const id = `idx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}_${chunks}`;
      const emb = await embedText(`${doc.title}\n${content}`);
      const item: IndexedChunk = {
        id,
        title: doc.title,
        content,
        source: doc.source,
        vector: emb?.vector,
        model: emb?.model,
      };
      if (emb) embedded++;
      vectorStore.push(item);
      globalMemory.add({
        layer: "knowledge",
        content: `${doc.title}\n${content}`,
        source: doc.source,
        importance: 65,
        trust: 80,
        metadata: { embeddingModel: emb?.model, hasVector: Boolean(emb) },
      });
      chunks++;
    }
  }

  return { chunks, embedded };
}

export async function vectorSearch(query: string, limit = 5): Promise<
  Array<{ id: string; title: string; content: string; source?: string; score: number }>
> {
  const qEmb = await embedText(query);
  if (!qEmb) {
    // Lexical fallback
    const hits = globalMemory.search({ text: query, layers: ["knowledge"], limit });
    return hits.map((h) => ({
      id: h.id,
      title: String(h.metadata?.title ?? "memory"),
      content: h.content,
      source: h.source,
      score: h.score,
    }));
  }

  const scored = vectorStore
    .filter((c) => c.vector && c.vector.length === qEmb.dimensions)
    .map((c) => ({
      id: c.id,
      title: c.title,
      content: c.content,
      source: c.source,
      score: cosineSimilarity(qEmb.vector, c.vector!),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
}

export function vectorStoreStats(): { chunks: number; withVectors: number } {
  return {
    chunks: vectorStore.length,
    withVectors: vectorStore.filter((c) => c.vector).length,
  };
}
