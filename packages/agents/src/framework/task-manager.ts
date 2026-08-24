/**
 * Agent task manager — assign, complete, fail, retry, escalate.
 */

import type { TaskStage } from "@superior-ai/core";
import { sendAgentMessage } from "./message-bus";

export type AgentTaskStatus =
  | "pending"
  | "assigned"
  | "running"
  | "completed"
  | "failed"
  | "retrying"
  | "escalated"
  | "cancelled";

export interface AgentTask {
  id: string;
  title: string;
  objective: string;
  assigneeId?: string;
  requesterId?: string;
  status: AgentTaskStatus;
  stage: TaskStage;
  attempts: number;
  maxAttempts: number;
  result?: string;
  error?: string;
  parentTaskId?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

const tasks = new Map<string, AgentTask>();

function tid() {
  return `atask_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function createAgentTask(input: {
  title: string;
  objective: string;
  requesterId?: string;
  maxAttempts?: number;
  metadata?: Record<string, unknown>;
}): AgentTask {
  const now = new Date().toISOString();
  const task: AgentTask = {
    id: tid(),
    title: input.title,
    objective: input.objective,
    requesterId: input.requesterId,
    status: "pending",
    stage: "planning",
    attempts: 0,
    maxAttempts: input.maxAttempts ?? 3,
    createdAt: now,
    updatedAt: now,
    metadata: input.metadata,
  };
  tasks.set(task.id, task);
  return task;
}

export function getAgentTask(id: string): AgentTask | null {
  return tasks.get(id) ?? null;
}

export function listAgentTasks(filter?: {
  status?: AgentTaskStatus;
  assigneeId?: string;
}): AgentTask[] {
  return [...tasks.values()].filter((t) => {
    if (filter?.status && t.status !== filter.status) return false;
    if (filter?.assigneeId && t.assigneeId !== filter.assigneeId) return false;
    return true;
  });
}

export async function assignTask(
  taskId: string,
  assigneeId: string
): Promise<AgentTask | null> {
  const t = tasks.get(taskId);
  if (!t) return null;
  t.assigneeId = assigneeId;
  t.status = "assigned";
  t.stage = "delegating";
  t.updatedAt = new Date().toISOString();
  await sendAgentMessage({
    from: t.requesterId ?? "system",
    to: assigneeId,
    type: "task_assign",
    payload: { taskId: t.id, title: t.title, objective: t.objective },
    correlationId: t.id,
  });
  return t;
}

export function startTask(taskId: string): AgentTask | null {
  const t = tasks.get(taskId);
  if (!t) return null;
  t.status = "running";
  t.stage = "researching";
  t.attempts += 1;
  t.updatedAt = new Date().toISOString();
  return t;
}

export async function completeTask(
  taskId: string,
  result: string
): Promise<AgentTask | null> {
  const t = tasks.get(taskId);
  if (!t) return null;
  t.status = "completed";
  t.stage = "completed";
  t.result = result;
  t.updatedAt = new Date().toISOString();
  if (t.requesterId) {
    await sendAgentMessage({
      from: t.assigneeId ?? "system",
      to: t.requesterId,
      type: "task_result",
      payload: { taskId: t.id, status: "completed", result },
      correlationId: t.id,
    });
  }
  return t;
}

export async function failTask(
  taskId: string,
  error: string
): Promise<AgentTask | null> {
  const t = tasks.get(taskId);
  if (!t) return null;
  t.error = error;
  t.updatedAt = new Date().toISOString();
  if (t.attempts < t.maxAttempts) {
    t.status = "retrying";
    t.stage = "retrying";
  } else {
    t.status = "failed";
    t.stage = "failed";
  }
  return t;
}

export async function retryTask(taskId: string): Promise<AgentTask | null> {
  const t = tasks.get(taskId);
  if (!t) return null;
  if (t.attempts >= t.maxAttempts) {
    t.status = "failed";
    t.stage = "failed";
    t.updatedAt = new Date().toISOString();
    return t;
  }
  t.status = "running";
  t.stage = "retrying";
  t.attempts += 1;
  t.updatedAt = new Date().toISOString();
  return t;
}

export async function escalateTask(
  taskId: string,
  toAgentId: string,
  reason: string
): Promise<AgentTask | null> {
  const t = tasks.get(taskId);
  if (!t) return null;
  t.status = "escalated";
  t.stage = "awaiting_approval";
  t.updatedAt = new Date().toISOString();
  t.metadata = { ...t.metadata, escalateReason: reason, escalatedTo: toAgentId };
  await sendAgentMessage({
    from: t.assigneeId ?? "system",
    to: toAgentId,
    type: "escalate",
    payload: { taskId: t.id, reason, objective: t.objective },
    correlationId: t.id,
  });
  // reassign
  t.assigneeId = toAgentId;
  return t;
}

export function taskStats(): Record<string, number> {
  const stats: Record<string, number> = {};
  for (const t of tasks.values()) {
    stats[t.status] = (stats[t.status] ?? 0) + 1;
  }
  return stats;
}
