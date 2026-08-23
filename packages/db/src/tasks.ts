import { prisma } from "./client";

export interface TaskCheckpoint {
  id: string;
  taskId: string;
  stage: string;
  data: Record<string, unknown>;
  createdAt: string;
}

// In-memory fallback when no DATABASE_URL is configured — same graceful-degradation
// pattern used throughout packages/memory. A real `TaskCheckpoint` Prisma model can be
// added to schema.prisma once durable checkpointing is actually needed in production.
const memoryCheckpoints: TaskCheckpoint[] = [];

export async function checkpointTask(taskId: string, stage: string, data: Record<string, unknown> = {}): Promise<TaskCheckpoint> {
  const checkpoint: TaskCheckpoint = {
    id: `chk_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    taskId,
    stage,
    data,
    createdAt: new Date().toISOString(),
  };
  // Prisma has no TaskCheckpoint model yet — this always uses the in-memory
  // fallback today. Wiring a real table is a follow-up once this needs to
  // survive restarts.
  void prisma;
  memoryCheckpoints.push(checkpoint);
  if (memoryCheckpoints.length > 10_000) memoryCheckpoints.shift();
  return checkpoint;
}

export function getTaskCheckpoints(taskId: string): TaskCheckpoint[] {
  return memoryCheckpoints.filter((c) => c.taskId === taskId);
}
