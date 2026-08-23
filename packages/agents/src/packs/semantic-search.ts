/**
 * Semantic pack search
 * - Embeddings via @superior-ai/memory when OPENAI_API_KEY (or compatible) is set
 * - Lexical fallback always available
 * - Optional blend with marketplace rank score
 */

import { listCatalog, getPack, type AgentPackManifest, type PackCategory } from "./registry";
import { scorePack, type RankedPack } from "./ranking";

export interface PackSearchHit {
  pack: AgentPackManifest;
  score: number;
  semanticScore: number;
  lexicalScore: number;
  rankScore: number;
  method: "embedding" | "lexical" | "hybrid";
  highlights: string[];
}

function packDocument(pack: AgentPackManifest): string {
  return [
    pack.name,
    pack.description,
    pack.category,
    pack.author,
    pack.pricing,
    ...pack.agents,
    ...pack.workflows,
    ...pack.requiredTools,
    ...pack.requiredPermissions,
  ]
    .join(" ")
    .toLowerCase();
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+#]+/i)
    .filter((t) => t.length > 1);
}

function lexicalScore(query: string, pack: AgentPackManifest): { score: number; highlights: string[] } {
  const qTokens = [...new Set(tokenize(query))];
  if (!qTokens.length) return { score: 0, highlights: [] };

  const doc = packDocument(pack);
  const name = pack.name.toLowerCase();
  const desc = pack.description.toLowerCase();
  const highlights: string[] = [];
  let score = 0;

  for (const t of qTokens) {
    if (name.includes(t)) {
      score += 3;
      if (!highlights.includes(pack.name)) highlights.push(pack.name);
    }
    if (pack.category.includes(t)) {
      score += 2;
      highlights.push(`category:${pack.category}`);
    }
    if (pack.agents.some((a) => a.toLowerCase().includes(t))) {
      score += 2;
      const agent = pack.agents.find((a) => a.toLowerCase().includes(t));
      if (agent) highlights.push(agent);
    }
    if (pack.workflows.some((w) => w.toLowerCase().includes(t))) {
      score += 1.5;
    }
    if (desc.includes(t)) {
      score += 1;
    }
    if (doc.includes(t)) {
      score += 0.5;
    }
  }

  // Phrase boost
  const q = query.toLowerCase().trim();
  if (q.length > 3 && name.includes(q)) score += 5;
  if (q.length > 3 && desc.includes(q)) score += 2;

  return { score, highlights: highlights.slice(0, 6) };
}

function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d === 0 ? 0 : dot / d;
}

/** In-memory embedding cache for catalog packs */
const packVectors = new Map<string, { vector: number[]; model: string }>();

async function embed(text: string): Promise<{ vector: number[]; model: string } | null> {
  try {
    const { embedText } = await import("@superior-ai/memory");
    const result = await embedText(text);
    if (!result || !result.vector?.length) return null;
    return { vector: result.vector, model: result.model };
  } catch {
    return null;
  }
}

export async function ensurePackEmbeddings(
  packs?: AgentPackManifest[]
): Promise<{ embedded: number; skipped: number }> {
  const list = packs ?? listCatalog();
  let embedded = 0;
  let skipped = 0;
  for (const pack of list) {
    if (packVectors.has(pack.id)) {
      skipped++;
      continue;
    }
    const emb = await embed(packDocument(pack));
    if (emb) {
      packVectors.set(pack.id, emb);
      embedded++;
    } else {
      skipped++;
    }
  }
  return { embedded, skipped };
}

export async function semanticSearchPacks(input: {
  query: string;
  category?: PackCategory;
  limit?: number;
  /** Blend marketplace rank into final score (0–1) */
  rankBlend?: number;
}): Promise<{
  hits: PackSearchHit[];
  method: "embedding" | "lexical" | "hybrid";
  query: string;
  embeddingAvailable: boolean;
}> {
  const query = input.query.trim();
  const limit = input.limit ?? 10;
  const rankBlend = Math.min(1, Math.max(0, input.rankBlend ?? 0.25));
  const packs = listCatalog(input.category ? { category: input.category } : undefined);

  if (!query) {
    return {
      hits: [],
      method: "lexical",
      query,
      embeddingAvailable: false,
    };
  }

  const queryEmb = await embed(query);
  const embeddingAvailable = Boolean(queryEmb);

  if (queryEmb) {
    await ensurePackEmbeddings(packs);
  }

  const hits: PackSearchHit[] = [];

  for (const pack of packs) {
    const lex = lexicalScore(query, pack);
    let semanticScore = 0;
    let method: PackSearchHit["method"] = "lexical";

    if (queryEmb) {
      let entry = packVectors.get(pack.id);
      if (!entry) {
        const emb = await embed(packDocument(pack));
        if (emb) {
          packVectors.set(pack.id, emb);
          entry = emb;
        }
      }
      if (entry && entry.vector.length === queryEmb.vector.length) {
        semanticScore = cosine(queryEmb.vector, entry.vector);
        method = lex.score > 0 ? "hybrid" : "embedding";
      }
    }

    // Normalize lexical to ~0–1 scale for blending
    const lexicalNorm = Math.min(1, lex.score / 12);
    const rank = scorePack(pack).score;
    const rankNorm = Math.min(1, rank / 50);

    // Final: prefer semantic when available
    const base = embeddingAvailable
      ? semanticScore * 0.7 + lexicalNorm * 0.3
      : lexicalNorm;
    const finalScore = base * (1 - rankBlend) + rankNorm * rankBlend;

    if (finalScore <= 0 && lex.score <= 0 && semanticScore <= 0) continue;

    hits.push({
      pack,
      score: Math.round(finalScore * 1000) / 1000,
      semanticScore: Math.round(semanticScore * 1000) / 1000,
      lexicalScore: Math.round(lex.score * 100) / 100,
      rankScore: rank,
      method,
      highlights: lex.highlights,
    });
  }

  hits.sort((a, b) => b.score - a.score || b.rankScore - a.rankScore);
  const top = hits.slice(0, limit);

  const method: "embedding" | "lexical" | "hybrid" = embeddingAvailable
    ? top.some((h) => h.method === "hybrid" || h.method === "embedding")
      ? top.every((h) => h.method === "embedding")
        ? "embedding"
        : "hybrid"
      : "lexical"
    : "lexical";

  return {
    hits: top,
    method,
    query,
    embeddingAvailable,
  };
}

/** Convenience: ranked packs filtered by semantic search */
export async function searchAndRank(input: {
  query: string;
  category?: PackCategory;
  limit?: number;
}): Promise<RankedPack[]> {
  const { hits } = await semanticSearchPacks({ ...input, rankBlend: 0.35 });
  return hits.map((h, i) => {
    const { score, metrics, reasons } = scorePack(h.pack);
    return {
      ...h.pack,
      score: Math.round((h.score * 50 + score * 0.5) * 100) / 100,
      rank: i + 1,
      metrics,
      reasons: [
        ...reasons,
        `search:${h.method}`,
        ...(h.highlights.slice(0, 2).map((x) => `match:${x}`)),
      ],
    };
  });
}
