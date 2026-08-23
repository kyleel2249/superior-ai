/**
 * apps/web/src/app/api/knowledge/route.ts imports ingestDocument, retrieve,
 * buildRagContext from "@superior-ai/memory" — none of this existed. This is
 * an in-process chunk store with token-overlap retrieval, following the same
 * scoring approach already used in ./persistent.ts (no embedding model is
 * wired up, so this is lexical retrieval, not vector search).
 */

export interface DocumentChunk {
  id: string;
  documentTitle: string;
  source?: string;
  layer: string;
  content: string;
  chunkIndex: number;
  createdAt: string;
}

const chunks: DocumentChunk[] = [];
const MAX_CHUNKS = 20_000;
const CHUNK_SIZE = 800; // characters

function chunkText(content: string): string[] {
  const paragraphs = content.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const result: string[] = [];
  let buffer = "";
  for (const para of paragraphs) {
    if ((buffer + "\n\n" + para).length > CHUNK_SIZE && buffer) {
      result.push(buffer);
      buffer = para;
    } else {
      buffer = buffer ? `${buffer}\n\n${para}` : para;
    }
  }
  if (buffer) result.push(buffer);
  return result.length > 0 ? result : [content];
}

function tokenize(s: string): string[] {
  return s.toLowerCase().split(/[^a-z0-9]+/i).filter((t) => t.length > 2);
}

export function ingestDocument(input: { title: string; content: string; source?: string; layer?: string }): DocumentChunk[] {
  const pieces = chunkText(input.content);
  const now = new Date().toISOString();
  const created = pieces.map((content, chunkIndex) => {
    const chunk: DocumentChunk = {
      id: `chunk_${Date.now().toString(36)}_${chunkIndex}_${Math.random().toString(36).slice(2, 6)}`,
      documentTitle: input.title,
      source: input.source,
      layer: input.layer ?? "knowledge",
      content,
      chunkIndex,
      createdAt: now,
    };
    chunks.push(chunk);
    return chunk;
  });
  while (chunks.length > MAX_CHUNKS) chunks.shift();
  return created;
}

export function retrieve(query: string, limit = 6): DocumentChunk[] {
  const qTokens = tokenize(query);
  if (qTokens.length === 0) return chunks.slice(-limit).reverse();
  const scored = chunks.map((c) => {
    const tokens = tokenize(c.content + " " + c.documentTitle);
    const overlap = qTokens.filter((t) => tokens.includes(t) || c.content.toLowerCase().includes(t)).length;
    return { chunk: c, score: overlap / qTokens.length };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.chunk);
}

export function buildRagContext(query: string, limit = 6): string {
  const results = retrieve(query, limit);
  if (results.length === 0) return "";
  const lines = results.map(
    (c) => `## ${c.documentTitle}${c.source ? ` (${c.source})` : ""} [chunk ${c.chunkIndex}]\n${c.content}`
  );
  return lines.join("\n\n---\n\n");
}
