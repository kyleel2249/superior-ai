/**
 * packages/memory/src/rag.ts already imported indexDocuments, vectorSearch,
 * vectorStoreStats from "./indexer" — didn't exist under any filename.
 * Targets the KnowledgeItem model + `embedding vector(1536)` column already
 * defined in packages/db/prisma/schema.prisma and migrations/003_vector_embeddings.sql.
 * Same dynamic-import-@superior-ai/db pattern already used in ./postgres.ts.
 */
import { embedText, cosineSimilarity } from "./embeddings";
import { globalMemory } from "./layers";

interface InMemoryVectorRecord {
  id: string;
  title: string;
  content: string;
  source?: string;
  vector?: number[];
}

type PrismaLike = {
  $executeRawUnsafe: (query: string, ...args: unknown[]) => Promise<unknown>;
  $queryRawUnsafe: (query: string, ...args: unknown[]) => Promise<unknown>;
};

let prisma: PrismaLike | null = null;
let prismaTried = false;
let dbAvailableSyncHint = Boolean(process.env.DATABASE_URL);

async function getPrisma(): Promise<PrismaLike | null> {
  if (prismaTried) return prisma;
  prismaTried = true;
  if (!process.env.DATABASE_URL) {
    dbAvailableSyncHint = false;
    return null;
  }
  try {
    const mod = await import("@superior-ai/db");
    const client = (mod as { prisma?: PrismaLike }).prisma;
    if (client) {
      prisma = client;
      dbAvailableSyncHint = true;
      return prisma;
    }
  } catch {
    /* fall through to in-memory */
  }
  dbAvailableSyncHint = false;
  return null;
}

const inMemoryStore: InMemoryVectorRecord[] = [];
const MAX_RECORDS = 20_000;

function chunkText(content: string, maxLen = 800): string[] {
  const paragraphs = content.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const result: string[] = [];
  let buffer = "";
  for (const para of paragraphs) {
    if ((buffer + "\n\n" + para).length > maxLen && buffer) {
      result.push(buffer);
      buffer = para;
    } else {
      buffer = buffer ? `${buffer}\n\n${para}` : para;
    }
  }
  if (buffer) result.push(buffer);
  return result.length > 0 ? result : [content];
}

export interface IndexedDocResult {
  title: string;
  chunkIds: string[];
  embedded: number;
}

export async function indexDocuments(
  docs: Array<{ title: string; content: string; source?: string }>
): Promise<IndexedDocResult[]> {
  const db = await getPrisma();
  const results: IndexedDocResult[] = [];

  for (const doc of docs) {
    const pieces = chunkText(doc.content);
    const chunkIds: string[] = [];
    let embedded = 0;

    for (const piece of pieces) {
      const id = `kb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      chunkIds.push(id);
      const emb = await embedText(piece);
      if (emb) embedded += 1;

      globalMemory.add({ id, title: doc.title, content: piece, source: doc.source });

      if (db) {
        await db.$executeRawUnsafe(
          `INSERT INTO "KnowledgeItem" (id, title, content, source, tags, "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, '{}', now(), now())`,
          id,
          doc.title,
          piece,
          doc.source ?? null
        );
        if (emb) {
          const vectorLiteral = `[${emb.vector.join(",")}]`;
          await db.$executeRawUnsafe(`UPDATE "KnowledgeItem" SET embedding = $1::vector WHERE id = $2`, vectorLiteral, id);
        }
      } else {
        inMemoryStore.push({ id, title: doc.title, content: piece, source: doc.source, vector: emb?.vector });
        if (inMemoryStore.length > MAX_RECORDS) inMemoryStore.shift();
      }
    }

    results.push({ title: doc.title, chunkIds, embedded });
  }

  return results;
}

export interface VectorHit {
  id: string;
  title: string;
  content: string;
  source?: string;
  score: number;
}

export async function vectorSearch(query: string, limit = 10): Promise<VectorHit[]> {
  const emb = await embedText(query);
  if (!emb) return []; // no embedding available — honest empty, not a fake match

  const db = await getPrisma();
  if (db) {
    const vectorLiteral = `[${emb.vector.join(",")}]`;
    const rows = (await db.$queryRawUnsafe(
      `SELECT id, title, content, source, 1 - (embedding <=> $1::vector) AS score
       FROM "KnowledgeItem"
       WHERE embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT $2`,
      vectorLiteral,
      limit
    )) as Array<{ id: string; title: string; content: string; source: string | null; score: number }>;
    return rows.map((r) => ({ id: r.id, title: r.title, content: r.content, source: r.source ?? undefined, score: r.score }));
  }

  const scored = inMemoryStore
    .filter((r) => r.vector)
    .map((r) => ({ record: r, score: cosineSimilarity(emb.vector, r.vector!) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return scored.map((s) => ({ id: s.record.id, title: s.record.title, content: s.record.content, source: s.record.source, score: s.score }));
}

export function vectorStoreStats(): { backend: "postgres" | "memory"; indexedCount: number; embeddingsConfigured: boolean } {
  return {
    backend: dbAvailableSyncHint ? "postgres" : "memory",
    indexedCount: dbAvailableSyncHint ? -1 : inMemoryStore.length, // -1 = not tracked client-side for the postgres backend
    embeddingsConfigured: Boolean(process.env.OPENAI_API_KEY),
  };
}
