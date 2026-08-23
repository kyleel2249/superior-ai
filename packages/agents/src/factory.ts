export type FactoryStage = "plan" | "implement" | "test" | "review" | "done";

export interface FactoryTask {
  id: string;
  objective: string;
  repoUrl?: string;
  stage: FactoryStage;
  history: Array<{ stage: FactoryStage; at: string; note?: string }>;
  createdAt: string;
  updatedAt: string;
  awaitingApproval: boolean;
}

const STAGE_ORDER: FactoryStage[] = ["plan", "implement", "test", "review", "done"];
const tasks = new Map<string, FactoryTask>();

export function createFactoryTask(input: { objective: string; repoUrl?: string }): FactoryTask {
  const now = new Date().toISOString();
  const task: FactoryTask = {
    id: `fac_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    objective: input.objective,
    repoUrl: input.repoUrl,
    stage: "plan",
    history: [{ stage: "plan", at: now, note: "Task created" }],
    createdAt: now,
    updatedAt: now,
    // engineering pack requires human approval before touching a real repo
    awaitingApproval: Boolean(input.repoUrl),
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
 * Advances a task by exactly one stage. Requires the caller to supply
 * evidence for gated stages (e.g. `testsPassed`) rather than auto-marking
 * success — matches the "never invent test results" rule.
 */
export function advanceFactoryTask(
  id: string,
  input: { approve?: boolean; testsPassed?: boolean; note?: string }
): FactoryTask | undefined {
  const task = tasks.get(id);
  if (!task) return undefined;

  if (task.awaitingApproval) {
    if (!input.approve) {
      task.history.push({ stage: task.stage, at: new Date().toISOString(), note: "Blocked: awaiting human approval" });
      task.updatedAt = new Date().toISOString();
      return task;
    }
    task.awaitingApproval = false;
  }

  if (task.stage === "test" && input.testsPassed !== true) {
    task.history.push({ stage: task.stage, at: new Date().toISOString(), note: input.note ?? "Cannot advance: testsPassed must be explicitly confirmed" });
    task.updatedAt = new Date().toISOString();
    return task;
  }

  const idx = STAGE_ORDER.indexOf(task.stage);
  const next = STAGE_ORDER[Math.min(idx + 1, STAGE_ORDER.length - 1)]!;
  task.stage = next;
  task.updatedAt = new Date().toISOString();
  task.history.push({ stage: next, at: task.updatedAt, note: input.note });
  if (next === "review" && task.repoUrl) task.awaitingApproval = true;
  return task;
}
