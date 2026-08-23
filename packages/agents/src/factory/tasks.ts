/**
 * apps/web/src/app/api/factory/route.ts imports createFactoryTask,
 * advanceFactoryTask, getFactoryTask, listFactoryTasks from
 * "@superior-ai/agents" — none of this existed. This is a real (in-memory)
 * state machine with human-approval gates, matching the "Software Factory"
 * pack's own description: "Repo inspect, plan, implement, test, PR with
 * human approval gates."
 */

export type FactoryStage = "planning" | "implementing" | "testing" | "review" | "done" | "failed";

export interface FactoryTask {
  id: string;
  objective: string;
  repoUrl?: string;
  stage: FactoryStage;
  approvedForImplementation: boolean;
  log: Array<{ at: string; stage: FactoryStage; note: string }>;
  createdAt: string;
  updatedAt: string;
}

const tasks = new Map<string, FactoryTask>();

const STAGE_ORDER: FactoryStage[] = ["planning", "implementing", "testing", "review", "done"];

export function createFactoryTask(input: { objective: string; repoUrl?: string }): FactoryTask {
  if (!input.objective) throw new Error("objective is required to create a factory task");
  const now = new Date().toISOString();
  const task: FactoryTask = {
    id: `factory_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    objective: input.objective,
    repoUrl: input.repoUrl,
    stage: "planning",
    approvedForImplementation: false,
    log: [{ at: now, stage: "planning", note: `Task created: ${input.objective}` }],
    createdAt: now,
    updatedAt: now,
  };
  tasks.set(task.id, task);
  return task;
}

export function getFactoryTask(id: string): FactoryTask | undefined {
  return tasks.get(id);
}

export function listFactoryTasks(): FactoryTask[] {
  return Array.from(tasks.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/**
 * Advances a task to the next stage. Moving from "planning" to
 * "implementing" requires `input.approve === true` — this is the human
 * approval gate the pack description promises; nothing implements code
 * without it.
 */
export function advanceFactoryTask(
  taskId: string,
  input: { approve?: boolean; note?: string; fail?: boolean } = {}
): FactoryTask | undefined {
  const task = tasks.get(taskId);
  if (!task) return undefined;

  const now = new Date().toISOString();

  if (input.fail) {
    task.stage = "failed";
    task.log.push({ at: now, stage: "failed", note: input.note ?? "Task marked failed." });
    task.updatedAt = now;
    return task;
  }

  const currentIdx = STAGE_ORDER.indexOf(task.stage);
  if (currentIdx === -1 || task.stage === "done") {
    return task; // no-op: already terminal
  }

  const nextStage = STAGE_ORDER[currentIdx + 1];
  if (!nextStage) return task;

  if (task.stage === "planning" && nextStage === "implementing" && !input.approve) {
    task.log.push({ at: now, stage: task.stage, note: "Advance blocked: implementation requires explicit approval (approve: true)." });
    task.updatedAt = now;
    return task;
  }

  task.stage = nextStage;
  task.log.push({ at: now, stage: nextStage, note: input.note ?? `Advanced to ${nextStage}.` });
  if (nextStage === "implementing") task.approvedForImplementation = true;
  task.updatedAt = now;
  return task;
}
