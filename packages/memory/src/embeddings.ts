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
