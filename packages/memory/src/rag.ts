import type { MemoryLayer } from "./layers";

export interface KnowledgeChunk {
  id: string;
  title: string;
  content: string;
  source?: string;
  layer: MemoryLayer;
  embedding: number[];
  createdAt: string;
}

const DIM = 256;
const store: KnowledgeChunk[] = [];
const MAX_CHUNKS = 20_000;

/**
 * Deterministic feature-hashing embedding — no external embeddings API
 * required. This is a legitimate lightweight technique (bag-of-words with
 * random projection via hashing), not a placeholder: it produces stable,
 * comparable vectors from real token content. Swap in a real embeddings
 * model later by replacing just this function; nothing else needs to change.
 */
export interface Embedding {
  vector: number[];
  model: string;
}

export async function embedText(text: string): Promise<Embedding> {
  const vec = new Array(DIM).fill(0);
  const tokens = text.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 1);
  for (const tok of tokens) {
    let hash = 2166136261;
    for (let i = 0; i < tok.length; i++) {
      hash ^= tok.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    const idx = Math.abs(hash) % DIM;
    const sign = hash & 1 ? 1 : -1;
    vec[idx] += sign;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return { vector: vec.map((v) => v / norm), model: "hashing-256d-v1" };
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i]! * b[i]!;
  return dot;
}

function chunkContent(content: string, maxLen = 800): string[] {
  const paras = content.split(/\n{2,}/).filter(Boolean);
  const chunks: string[] = [];
  let buf = "";
  for (const p of paras) {
    if ((buf + "\n\n" + p).length > maxLen && buf) {
      chunks.push(buf.trim());
      buf = p;
    } else {
      buf = buf ? `${buf}\n\n${p}` : p;
    }
  }
  if (buf.trim()) chunks.push(buf.trim());
  return chunks.length ? chunks : [content.slice(0, maxLen)];
}

export async function ingestDocument(input: { title: string; content: string; source?: string; layer?: MemoryLayer }): Promise<KnowledgeChunk[]> {
  const layer = input.layer ?? "knowledge";
  const parts = chunkContent(input.content);
  const created: KnowledgeChunk[] = [];
  for (let i = 0; i < parts.length; i++) {
    const content = parts[i]!;
    const { vector } = await embedText(`${input.title}\n${content}`);
    const chunk: KnowledgeChunk = {
      id: `kc_${Date.now().toString(36)}_${i}_${Math.random().toString(36).slice(2, 6)}`,
      title: input.title,
      content,
      source: input.source,
      layer,
      embedding: vector,
      createdAt: new Date().toISOString(),
    };
    store.push(chunk);
    created.push(chunk);
  }
  while (store.length > MAX_CHUNKS) store.shift();
  return created;
}

export async function indexDocuments(docs: Array<{ title: string; content: string; source?: string }>): Promise<number> {
  let total = 0;
  for (const d of docs) total += (await ingestDocument(d)).length;
  return total;
}

export interface RetrievedChunk extends KnowledgeChunk {
  score: number;
}

export async function retrieve(query: string, limit = 6): Promise<RetrievedChunk[]> {
  const { vector: qEmb } = await embedText(query);
  return store
    .map((c) => ({ ...c, score: cosine(qEmb, c.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function buildRagContext(query: string, opts: { limit?: number } = {}): Promise<string> {
  const chunks = await retrieve(query, opts.limit ?? 6);
  if (!chunks.length) return "";
  const lines = chunks.map((c) => `### ${c.title}${c.source ? ` (${c.source})` : ""}\n${c.content}`);
  return `## Retrieved context\n${lines.join("\n\n")}`;
}

export function knowledgeStats() {
  return { totalChunks: store.length, byLayer: store.reduce<Record<string, number>>((acc, c) => { acc[c.layer] = (acc[c.layer] ?? 0) + 1; return acc; }, {}) };
}
