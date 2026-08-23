/**
 * Embeddings + pgvector-ready interface
 * Uses OpenAI embeddings when key present; otherwise lexical-only RAG.
 */

export interface EmbeddingResult {
  vector: number[];
  model: string;
  dimensions: number;
  provider: string;
}

export async function embedText(text: string): Promise<EmbeddingResult | null> {
  const key = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
  if (!key) return null;

  const usingOpenRouter = !process.env.OPENAI_API_KEY && !!process.env.OPENROUTER_API_KEY;
  const base =
    process.env.OPENAI_BASE_URL ||
    (usingOpenRouter
      ? process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1"
      : "https://api.openai.com/v1");
  const model =
    process.env.OPENAI_EMBEDDING_MODEL ||
    (usingOpenRouter ? "openai/text-embedding-3-small" : "text-embedding-3-small");

  try {
    const res = await fetch(`${base}/embeddings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...(usingOpenRouter
          ? {
              "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER || process.env.NEXT_PUBLIC_APP_URL || "https://superior-ai.local",
              "X-Title": process.env.OPENROUTER_APP_TITLE || "SUPERIOR AI",
            }
          : {}),
      },
      body: JSON.stringify({ model, input: text.slice(0, 8000) }),
    });
    if (!res.ok) {
      console.warn("[embeddings] HTTP", res.status);
      return null;
    }
    const data = (await res.json()) as {
      data: Array<{ embedding: number[] }>;
      model: string;
    };
    const vector = data.data[0]?.embedding ?? [];
    return {
      vector,
      model: data.model || model,
      dimensions: vector.length,
      provider: "openai",
    };
  } catch (err) {
    console.warn("[embeddings]", err);
    return null;
  }
}

/** Cosine similarity for in-memory vector search */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

/** SQL helper text for pgvector upsert (when Prisma + extension ready) */
export function pgvectorUpsertHint(): string {
  return `
-- Enable: CREATE EXTENSION IF NOT EXISTS vector;
-- ALTER TABLE "KnowledgeItem" ADD COLUMN IF NOT EXISTS embedding vector(1536);
-- CREATE INDEX ON "KnowledgeItem" USING ivfflat (embedding vector_cosine_ops);
`.trim();
}
