/**
 * Durable task persistence — Prisma when available, memory fallback
 */

import { prisma, isDatabaseReady } from "./client";

export interface TaskRecord {
  id: string;
  userId: string;
  projectId?: string | null;
  title: string;
  objective: string;
  stage: string;
  intelligenceLevel: string;
  state?: unknown;
  completedSteps: string[];
  pendingSteps: string[];
  modelUsed?: string | null;
  tokenUsage?: unknown;
  costUsd?: number | null;
  retryCount: number;
  errors?: unknown;
  checkpoint?: unknown;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date | null;
}

const memoryTasks = new Map<string, TaskRecord>();

export async function saveTask(input: {
  id?: string;
  userId: string;
  projectId?: string;
  title: string;
  objective: string;
  stage?: string;
  intelligenceLevel?: string;
  pendingSteps?: string[];
  state?: unknown;
}): Promise<TaskRecord> {
  const id = input.id ?? `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date();

  if (isDatabaseReady() && prisma) {
    try {
      const row = await prisma.task.upsert({
        where: { id },
        create: {
          id,
          userId: input.userId,
          projectId: input.projectId,
          title: input.title,
          objective: input.objective,
          stage: input.stage ?? "planning",
          intelligenceLevel: input.intelligenceLevel ?? "BALANCED",
          completedSteps: [],
          pendingSteps: input.pendingSteps ?? [],
          state: input.state as object | undefined,
          retryCount: 0,
        },
        update: {
          title: input.title,
          objective: input.objective,
          stage: input.stage,
          state: input.state as object | undefined,
          pendingSteps: input.pendingSteps,
        },
      });
      return row as unknown as TaskRecord;
    } catch (err) {
      console.warn("[db/tasks] Prisma save failed, using memory:", err);
    }
  }

  const existing = memoryTasks.get(id);
  const record: TaskRecord = {
    id,
    userId: input.userId,
    projectId: input.projectId,
    title: input.title,
    objective: input.objective,
    stage: input.stage ?? existing?.stage ?? "planning",
    intelligenceLevel: input.intelligenceLevel ?? "BALANCED",
    state: input.state ?? existing?.state,
    completedSteps: existing?.completedSteps ?? [],
    pendingSteps: input.pendingSteps ?? existing?.pendingSteps ?? [],
    retryCount: existing?.retryCount ?? 0,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  memoryTasks.set(id, record);
  return record;
}

export async function updateTaskStage(
  id: string,
  patch: {
    stage?: string;
    completeStep?: string;
    state?: unknown;
    modelUsed?: string;
    error?: { message: string };
    costUsd?: number;
    tokenUsage?: unknown;
    completed?: boolean;
  }
): Promise<TaskRecord | null> {
  if (isDatabaseReady() && prisma) {
    try {
      const current = await prisma.task.findUnique({ where: { id } });
      if (!current) return null;
      const completedSteps = [...(current.completedSteps ?? [])];
      let pendingSteps = [...(current.pendingSteps ?? [])];
      if (patch.completeStep) {
        completedSteps.push(patch.completeStep);
        pendingSteps = pendingSteps.filter((s) => s !== patch.completeStep);
      }
      const errors = Array.isArray(current.errors) ? [...(current.errors as unknown[])] : [];
      if (patch.error) {
        errors.push({ at: new Date().toISOString(), message: patch.error.message });
      }
      const row = await prisma.task.update({
        where: { id },
        data: {
          stage: patch.stage ?? current.stage,
          completedSteps,
          pendingSteps,
          state: (patch.state as object) ?? current.state ?? undefined,
          modelUsed: patch.modelUsed ?? current.modelUsed,
          costUsd: patch.costUsd ?? current.costUsd,
          tokenUsage: (patch.tokenUsage as object) ?? current.tokenUsage ?? undefined,
          errors: errors as object[],
          retryCount: patch.error ? current.retryCount + 1 : current.retryCount,
          completedAt: patch.completed ? new Date() : current.completedAt,
          checkpoint: {
            stage: patch.stage ?? current.stage,
            updatedAt: new Date().toISOString(),
          },
        },
      });
      return row as unknown as TaskRecord;
    } catch (err) {
      console.warn("[db/tasks] Prisma update failed:", err);
    }
  }

  const mem = memoryTasks.get(id);
  if (!mem) return null;
  if (patch.stage) mem.stage = patch.stage;
  if (patch.completeStep) {
    mem.completedSteps.push(patch.completeStep);
    mem.pendingSteps = mem.pendingSteps.filter((s) => s !== patch.completeStep);
  }
  if (patch.state) mem.state = { ...(mem.state as object), ...(patch.state as object) };
  if (patch.modelUsed) mem.modelUsed = patch.modelUsed;
  if (patch.costUsd !== undefined) mem.costUsd = patch.costUsd;
  if (patch.tokenUsage) mem.tokenUsage = patch.tokenUsage;
  if (patch.error) {
    mem.retryCount += 1;
    const errs = Array.isArray(mem.errors) ? (mem.errors as unknown[]) : [];
    errs.push({ at: new Date().toISOString(), message: patch.error.message });
    mem.errors = errs;
  }
  if (patch.completed) mem.completedAt = new Date();
  mem.updatedAt = new Date();
  memoryTasks.set(id, mem);
  return mem;
}

export async function getTask(id: string): Promise<TaskRecord | null> {
  if (isDatabaseReady() && prisma) {
    try {
      const row = await prisma.task.findUnique({ where: { id } });
      if (row) return row as unknown as TaskRecord;
    } catch {
      /* fall through */
    }
  }
  return memoryTasks.get(id) ?? null;
}

export async function listTasks(userId?: string): Promise<TaskRecord[]> {
  if (isDatabaseReady() && prisma) {
    try {
      const rows = await prisma.task.findMany({
        where: userId ? { userId } : undefined,
        orderBy: { updatedAt: "desc" },
        take: 100,
      });
      return rows as unknown as TaskRecord[];
    } catch {
      /* fall through */
    }
  }
  const all = Array.from(memoryTasks.values());
  return userId ? all.filter((t) => t.userId === userId) : all;
}
