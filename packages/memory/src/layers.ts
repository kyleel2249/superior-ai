/**
 * packages/memory/src/rag.ts already imported `globalMemory` from "./layers"
 * — didn't exist under any filename. This is the lexical half of hybridRetrieve;
 * indexer.ts pushes every ingested chunk in here alongside the vector store so
 * both halves of the hybrid search see the same documents.
 */

export interface MemoryChunk {
  id: string;
  title: string;
  content: string;
  source?: string;
  metadata?: Record<string, unknown>;
  addedAt: string;
}

export interface LexicalHit {
  id: string;
  content: string;
  source?: string;
  score: number;
  metadata?: Record<string, unknown>;
}

const MAX_CHUNKS = 20_000;

function tokenize(s: string): string[] {
  return s.toLowerCase().split(/[^a-z0-9]+/i).filter((t) => t.length > 2);
}

class GlobalMemoryStore {
  private chunks: MemoryChunk[] = [];

  add(chunk: Omit<MemoryChunk, "addedAt">): MemoryChunk {
    const full: MemoryChunk = { ...chunk, addedAt: new Date().toISOString() };
    this.chunks.push(full);
    if (this.chunks.length > MAX_CHUNKS) this.chunks.shift();
    return full;
  }

  search(input: { text: string; limit?: number }): LexicalHit[] {
    const limit = input.limit ?? 10;
    const qTokens = tokenize(input.text);
    if (qTokens.length === 0) return [];
    const scored = this.chunks.map((c) => {
      const tokens = new Set(tokenize(c.content + " " + c.title));
      const overlap = qTokens.filter((t) => tokens.has(t)).length;
      return { chunk: c, score: overlap / qTokens.length };
    });
    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => ({ id: s.chunk.id, content: s.chunk.content, source: s.chunk.source, score: s.score, metadata: { title: s.chunk.title, ...s.chunk.metadata } }));
  }

  count(): number {
    return this.chunks.length;
  }
}

export const globalMemory = new GlobalMemoryStore();
