/**
 * Durable task checkpoint store (in-memory foundation; persist via Prisma next)
 */

import type { TaskCheckpoint, TaskStage } from "@superior-ai/core";

const checkpoints = new Map<string, TaskCheckpoint>();

export function createTask(input: {
  taskId: string;
  stage?: TaskStage;
  pendingSteps?: string[];
}): TaskCheckpoint {
  const now = new Date().toISOString();
  const cp: TaskCheckpoint = {
    taskId: input.taskId,
    stage: input.stage ?? "planning",
    completedSteps: [],
    pendingSteps: input.pendingSteps ?? [],
    state: {},
    artifacts: [],
    errors: [],
    retryCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  checkpoints.set(input.taskId, cp);
  return cp;
}

export function getCheckpoint(taskId: string): TaskCheckpoint | undefined {
  return checkpoints.get(taskId);
}

export function updateCheckpoint(
  taskId: string,
  patch: Partial<Pick<TaskCheckpoint, "stage" | "state" | "modelUsed" | "tokenUsage" | "costUsd">> & {
    completeStep?: string;
    addArtifact?: string;
    error?: { message: string; provider?: string };
  }
): TaskCheckpoint | undefined {
  const cp = checkpoints.get(taskId);
  if (!cp) return undefined;
  if (patch.stage) cp.stage = patch.stage;
  if (patch.state) cp.state = { ...cp.state, ...patch.state };
  if (patch.modelUsed) cp.modelUsed = patch.modelUsed;
  if (patch.tokenUsage) cp.tokenUsage = patch.tokenUsage;
  if (patch.costUsd !== undefined) cp.costUsd = patch.costUsd;
  if (patch.completeStep) {
    cp.completedSteps.push(patch.completeStep);
    cp.pendingSteps = cp.pendingSteps.filter((s) => s !== patch.completeStep);
  }
  if (patch.addArtifact) cp.artifacts.push(patch.addArtifact);
  if (patch.error) {
    cp.errors.push({ at: new Date().toISOString(), message: patch.error.message, provider: patch.error.provider });
    cp.retryCount += 1;
  }
  cp.updatedAt = new Date().toISOString();
  checkpoints.set(taskId, cp);
  return cp;
}

export function listCheckpoints(): TaskCheckpoint[] {
  return Array.from(checkpoints.values());
}
