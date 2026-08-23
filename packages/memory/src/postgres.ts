/**
 * Postgres-backed persistent memory with in-memory fallback
 */

import type { PersistentMemoryType, PersistentRecord } from "./persistent";
import * as memoryMem from "./persistent";

type PrismaLike = {
  persistentMemory: {
    create: (args: { data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
    update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
    updateMany: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<{ count: number }>;
    findMany: (args: Record<string, unknown>) => Promise<Array<Record<string, unknown>>>;
    findFirst: (args: Record<string, unknown>) => Promise<Record<string, unknown> | null>;
    count: (args?: Record<string, unknown>) => Promise<number>;
  };
};

let prisma: PrismaLike | null = null;
let prismaTried = false;

async function getPrisma(): Promise<PrismaLike | null> {
  if (prismaTried) return prisma;
  prismaTried = true;
  if (!process.env.DATABASE_URL) return null;
  try {
    const mod = await import("@superior-ai/db");
    const client = (mod as { prisma?: PrismaLike; getPrisma?: () => PrismaLike }).prisma
      ?? (mod as { getPrisma?: () => PrismaLike }).getPrisma?.();
    if (client?.persistentMemory) {
      prisma = client;
      return prisma;
    }
  } catch {
    /* fallback */
  }
  return null;
}

function rowToRecord(row: Record<string, unknown>): PersistentRecord {
  return {
    id: String(row.id),
    type: row.type as PersistentMemoryType,
    key: row.key ? String(row.key) : undefined,
    content: String(row.content),
    importance: Number(row.importance ?? 50),
    projectId: row.projectId ? String(row.projectId) : undefined,
    customerId: row.customerId ? String(row.customerId) : undefined,
    organizationId: row.organizationId ? String(row.organizationId) : undefined,
    profileId: row.profileId ? String(row.profileId) : undefined,
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    active: Boolean(row.active),
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
    metadata: (row.metadata as Record<string, unknown>) ?? undefined,
  };
}

export async function rememberDurable(
  input: Parameters<typeof memoryMem.remember>[0]
): Promise<PersistentRecord & { backend: "postgres" | "memory" }> {
  const db = await getPrisma();
  if (!db) {
    return { ...memoryMem.remember(input), backend: "memory" };
  }

  if (input.key) {
    const existing = await db.persistentMemory.findFirst({
      where: {
        key: input.key,
        active: true,
        profileId: input.profileId ?? null,
        organizationId: input.organizationId ?? null,
      },
    });
    if (existing) {
      const updated = await db.persistentMemory.update({
        where: { id: String(existing.id) },
        data: {
          content: input.content,
          importance: input.importance ?? existing.importance,
          tags: input.tags ?? existing.tags,
          metadata: input.metadata ?? existing.metadata,
        },
      });
      return { ...rowToRecord(updated), backend: "postgres" };
    }
  }

  const created = await db.persistentMemory.create({
    data: {
      type: input.type,
      key: input.key ?? null,
      content: input.content,
      importance: input.importance ?? 50,
      projectId: input.projectId ?? null,
      customerId: input.customerId ?? null,
      organizationId: input.organizationId ?? null,
      profileId: input.profileId ?? null,
      tags: input.tags ?? [],
      active: true,
      metadata: input.metadata ?? undefined,
    },
  });
  return { ...rowToRecord(created), backend: "postgres" };
}

export async function forgetDurable(input: {
  id?: string;
  key?: string;
  contentContains?: string;
  profileId?: string;
}): Promise<{ forgotten: number; backend: "postgres" | "memory" }> {
  const db = await getPrisma();
  if (!db) {
    return { ...memoryMem.forget(input), backend: "memory" };
  }

  if (input.id) {
    const r = await db.persistentMemory.updateMany({
      where: { id: input.id },
      data: { active: false },
    });
    return { forgotten: r.count, backend: "postgres" };
  }
  if (input.key) {
    const r = await db.persistentMemory.updateMany({
      where: {
        key: input.key,
        ...(input.profileId ? { profileId: input.profileId } : {}),
      },
      data: { active: false },
    });
    return { forgotten: r.count, backend: "postgres" };
  }
  if (input.contentContains) {
    const rows = await db.persistentMemory.findMany({
      where: {
        active: true,
        ...(input.profileId ? { profileId: input.profileId } : {}),
        content: { contains: input.contentContains, mode: "insensitive" },
      },
    });
    let n = 0;
    for (const row of rows) {
      await db.persistentMemory.update({
        where: { id: String(row.id) },
        data: { active: false },
      });
      n++;
    }
    return { forgotten: n, backend: "postgres" };
  }
  return { forgotten: 0, backend: "postgres" };
}

export async function retrieveRelevantDurable(input: {
  query: string;
  types?: PersistentMemoryType[];
  projectId?: string;
  customerId?: string;
  profileId?: string;
  organizationId?: string;
  limit?: number;
}): Promise<{ records: PersistentRecord[]; backend: "postgres" | "memory" }> {
  const db = await getPrisma();
  if (!db) {
    return { records: memoryMem.retrieveRelevant(input), backend: "memory" };
  }

  const where: Record<string, unknown> = { active: true };
  if (input.types?.length) where.type = { in: input.types };
  if (input.profileId) where.profileId = input.profileId;
  if (input.organizationId) where.organizationId = input.organizationId;
  if (input.customerId) where.customerId = input.customerId;
  if (input.projectId) where.projectId = input.projectId;

  const rows = await db.persistentMemory.findMany({
    where,
    orderBy: [{ importance: "desc" }, { updatedAt: "desc" }],
    take: 200,
  });

  const records = rows.map(rowToRecord);
  // Score in app layer (same relevance logic)
  const q = input.query.toLowerCase();
  const tokens = q.split(/[^a-z0-9]+/).filter((t) => t.length > 2);
  const scored = records
    .map((r) => {
      const text = (r.content + " " + r.tags.join(" ")).toLowerCase();
      let overlap = 0;
      for (const t of tokens) if (text.includes(t)) overlap++;
      if (tokens.length && overlap === 0 && r.importance < 80) return null;
      const score =
        (overlap / Math.max(1, tokens.length)) * 40 +
        r.importance * 0.4 +
        (r.type === "rejection" || r.type === "preference" ? 10 : 0);
      return { r, score };
    })
    .filter(Boolean) as Array<{ r: PersistentRecord; score: number }>;

  scored.sort((a, b) => b.score - a.score);
  return {
    records: scored.slice(0, input.limit ?? 12).map((s) => s.r),
    backend: "postgres",
  };
}

export async function memoryBackendStatus(): Promise<"postgres" | "memory"> {
  const db = await getPrisma();
  return db ? "postgres" : "memory";
}
