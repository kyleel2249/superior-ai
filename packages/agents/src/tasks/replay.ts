/**
 * Task checkpoints + lightweight replay metadata
 */

export interface TaskCheckpoint {
  id: string;
  taskId: string;
  goal: string;
  progressPct: number;
  completedNodes: string[];
  pendingNodes: string[];
  failedNodes: string[];
  artifacts: string[];
  nextStep?: string;
  at: string;
}

export interface TaskReplaySpec {
  taskId: string;
  checkpointId: string;
  sameModel?: boolean;
  sameReasoning?: boolean;
  note: string;
}

const checkpoints = new Map<string, TaskCheckpoint[]>();

export function saveCheckpoint(
  input: Omit<TaskCheckpoint, "id" | "at">
): TaskCheckpoint {
  const cp: TaskCheckpoint = {
    ...input,
    id: `cp_${Date.now().toString(36)}`,
    at: new Date().toISOString(),
  };
  const arr = checkpoints.get(input.taskId) ?? [];
  arr.push(cp);
  checkpoints.set(input.taskId, arr);
  return cp;
}

export function listTaskCheckpoints(taskId: string): TaskCheckpoint[] {
  return [...(checkpoints.get(taskId) ?? [])];
}

export function latestCheckpoint(taskId: string): TaskCheckpoint | undefined {
  const arr = checkpoints.get(taskId) ?? [];
  return arr[arr.length - 1];
}

export function buildReplaySpec(taskId: string, checkpointId?: string): TaskReplaySpec {
  const arr = checkpoints.get(taskId) ?? [];
  const cp = checkpointId
    ? arr.find((c) => c.id === checkpointId)
    : arr[arr.length - 1];
  return {
    taskId,
    checkpointId: cp?.id ?? "",
    sameModel: true,
    sameReasoning: true,
    note: cp
      ? "Replay from checkpoint metadata — does not rehydrate full model state automatically"
      : "No checkpoint found",
  };
}
