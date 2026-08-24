/**
 * packages/agents/src/packs/semantic-search.ts already dynamically imports
 * embedText from "@superior-ai/memory" and gracefully falls back to
 * lexical-only search if it throws or returns null — this didn't exist
 * under any filename.
 */

export interface EmbeddingResult {
  vector: number[];
  model: string;
}

export async function embedText(text: string): Promise<EmbeddingResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !text.trim()) return null;
  const model = process.env.EMBEDDING_MODEL || "text-embedding-3-small";
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, input: text.slice(0, 8000) }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { data: Array<{ embedding: number[] }> };
  const vector = data.data[0]?.embedding;
  if (!vector) return null;
  return { vector, model };
}

/** packages/memory/src/rag.ts imports this — didn't exist under any filename. */
export function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  if (len === 0) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i]! * b[i]!;
    magA += a[i]! * a[i]!;
    magB += b[i]! * b[i]!;
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}
