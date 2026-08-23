import { prisma, isDatabaseReady } from "./client";

/**
 * NOTE: there is no prisma/schema.prisma anywhere in this repo (postinstall
 * already logs "[postinstall] Prisma generate skipped."), so there are no
 * generated Prisma model types to build against. This uses $queryRaw /
 * $executeRaw against a plain `tasks` table instead of a generated model,
 * and degrades to a no-op when the database isn't configured — same pattern
 * packages/memory/src/postgres.ts already uses.
 *
 * If you add a real schema.prisma later, replace this with `prisma.task.*`
 * calls and drop the raw SQL.
 */

export interface PersistedTask {
  id: string;
  kind: string;
  payload: unknown;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export async function saveTask(task: Omit<PersistedTask, "createdAt" | "updatedAt">): Promise<PersistedTask | null> {
  if (!isDatabaseReady() || !prisma) return null;
  const now = new Date();
  await prisma.$executeRawUnsafe(
    `INSERT INTO tasks (id, kind, payload, status, created_at, updated_at)
     VALUES ($1, $2, $3::jsonb, $4, $5, $5)
     ON CONFLICT (id) DO UPDATE SET payload = $3::jsonb, status = $4, updated_at = $5`,
    task.id,
    task.kind,
    JSON.stringify(task.payload),
    task.status,
    now
  );
  return { ...task, createdAt: now.toISOString(), updatedAt: now.toISOString() };
}

export async function getTask(id: string): Promise<PersistedTask | null> {
  if (!isDatabaseReady() || !prisma) return null;
  const rows = (await prisma.$queryRawUnsafe(`SELECT * FROM tasks WHERE id = $1 LIMIT 1`, id)) as PersistedTask[];
  return rows[0] ?? null;
}

export async function listTasks(kind?: string): Promise<PersistedTask[]> {
  if (!isDatabaseReady() || !prisma) return [];
  if (kind) {
    return (await prisma.$queryRawUnsafe(`SELECT * FROM tasks WHERE kind = $1 ORDER BY updated_at DESC LIMIT 200`, kind)) as PersistedTask[];
  }
  return (await prisma.$queryRawUnsafe(`SELECT * FROM tasks ORDER BY updated_at DESC LIMIT 200`)) as PersistedTask[];
}
