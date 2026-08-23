/**
 * Software Factory — plan → inspect repo → implement → code-exec validate → test → review
 * Does not invent test results; records only tool-reported outcomes.
 */

import { repoListFiles, type RepoInspectResult, executeCode, type CodeExecResult } from "@superior-ai/tools";

export type FactoryStage =
  | "intake"
  | "plan"
  | "inspect"
  | "implement"
  | "validate"
  | "test"
  | "review"
  | "pr"
  | "done"
  | "blocked";

export interface FactoryTask {
  id: string;
  objective: string;
  repoUrl?: string;
  localPath?: string;
  stage: FactoryStage;
  plan: string[];
  completed: string[];
  pendingHumanApproval: boolean;
  notes: string[];
  inspection?: RepoInspectResult;
  lastExec?: CodeExecResult;
  artifacts: Array<{ name: string; content: string; language?: string }>;
  createdAt: string;
  updatedAt: string;
}

const tasks = new Map<string, FactoryTask>();

export function createFactoryTask(input: {
  objective: string;
  repoUrl?: string;
  localPath?: string;
}): FactoryTask {
  const id = `sf_${Date.now().toString(36)}`;
  const plan = [
    "Clarify acceptance criteria",
    "Inspect repository structure",
    "Propose implementation plan",
    "Draft code changes (approval gate before write)",
    "Validate snippets via code-exec sandbox",
    "Run tests — record real results only",
    "Open PR / hand off for human review",
  ];
  const task: FactoryTask = {
    id,
    objective: input.objective,
    repoUrl: input.repoUrl,
    localPath: input.localPath,
    stage: "intake",
    plan,
    completed: [],
    pendingHumanApproval: false,
    notes: [
      "Software Factory will not claim tests passed without tool evidence.",
      input.repoUrl
        ? `Target repo: ${input.repoUrl}`
        : input.localPath
          ? `Local path: ${input.localPath}`
          : "No repo — planning + sandbox validation only.",
    ],
    artifacts: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  tasks.set(id, task);
  return task;
}

export function getFactoryTask(id: string): FactoryTask | null {
  return tasks.get(id) ?? null;
}

export function listFactoryTasks(): FactoryTask[] {
  return [...tasks.values()];
}

/** Inspect local workspace path (safe read-only). */
export async function factoryInspectRepo(
  id: string,
  path?: string
): Promise<FactoryTask | null> {
  const task = tasks.get(id);
  if (!task) return null;
  const target = path || task.localPath || process.cwd();
  try {
    // Prefer allowlisted sandbox; fall back to listing project if REPO_SANDBOX_ROOT unset
    const inspection = await repoListFiles({ subpath: ".", maxEntries: 150 });
    task.inspection = inspection;
    task.stage = "inspect";
    if (!task.completed.includes("Inspect repository structure")) {
      task.completed.push("Inspect repository structure");
    }
    const n = inspection.files?.length ?? 0;
    task.notes.push(
      inspection.success
        ? `Inspected sandbox (${inspection.root}): ${n} entries`
        : `Inspect note: ${inspection.error ?? inspection.note ?? "unavailable"}`
    );
    task.updatedAt = new Date().toISOString();
  } catch (e) {
    task.notes.push(
      `Inspect failed: ${e instanceof Error ? e.message : String(e)}`
    );
    task.stage = "blocked";
  }
  return task;
}

/** Validate a code snippet in the sandbox (does not mutate repo). */
export async function factoryValidateCode(
  id: string,
  input: { language: "javascript" | "typescript" | "python"; code: string; execute?: boolean }
): Promise<FactoryTask | null> {
  const task = tasks.get(id);
  if (!task) return null;
  const result = await executeCode({
    language: input.language,
    code: input.code,
    execute: input.execute === true,
    timeoutMs: 8000,
  });
  task.lastExec = result;
  task.stage = "validate";
  task.artifacts.push({
    name: `snippet-${Date.now()}.${input.language === "python" ? "py" : "js"}`,
    content: input.code,
    language: input.language,
  });
  if (result.executed && result.success) {
    task.notes.push(
      `Code-exec OK (${result.durationMs ?? "?"}ms). stdout: ${(result.stdout ?? "").slice(0, 200)}`
    );
    if (!task.completed.includes("Validate snippets via code-exec sandbox")) {
      task.completed.push("Validate snippets via code-exec sandbox");
    }
  } else if (result.executed === false && result.success) {
    task.notes.push(result.note ?? "Validated without execution (ALLOW_CODE_EXEC not set).");
  } else {
    task.notes.push(`Code-exec failed: ${result.error ?? result.stderr ?? "unknown"}`);
  }
  task.updatedAt = new Date().toISOString();
  return task;
}

export function advanceFactoryTask(
  id: string,
  input: {
    completeStep?: string;
    stage?: FactoryStage;
    note?: string;
    requireApproval?: boolean;
    testResult?: { passed: boolean; log?: string };
    artifact?: { name: string; content: string; language?: string };
  }
): FactoryTask | null {
  const task = tasks.get(id);
  if (!task) return null;

  if (input.completeStep && !task.completed.includes(input.completeStep)) {
    task.completed.push(input.completeStep);
  }
  if (input.stage) task.stage = input.stage;
  if (input.note) task.notes.push(input.note);
  if (input.artifact) task.artifacts.push(input.artifact);
  if (input.requireApproval) {
    task.pendingHumanApproval = true;
    task.stage = "blocked";
    task.notes.push("Awaiting human approval before mutating repository.");
  }
  if (input.testResult) {
    if (input.testResult.passed) {
      task.notes.push(
        `Tests reported passed.${input.testResult.log ? " " + input.testResult.log.slice(0, 200) : ""}`
      );
      if (!task.completed.includes("Run tests — record real results only")) {
        task.completed.push("Run tests — record real results only");
      }
    } else {
      task.notes.push(
        `Tests reported FAILED.${input.testResult.log ? " " + input.testResult.log.slice(0, 300) : ""}`
      );
      task.stage = "blocked";
    }
  }
  task.updatedAt = new Date().toISOString();
  return task;
}

/** Full pipeline helper: create → inspect → plan note. */
export async function runFactoryPipeline(input: {
  objective: string;
  localPath?: string;
  repoUrl?: string;
  snippet?: { language: "javascript" | "typescript" | "python"; code: string; execute?: boolean };
  approveMutations?: boolean;
}): Promise<FactoryTask> {
  const task = createFactoryTask({
    objective: input.objective,
    localPath: input.localPath,
    repoUrl: input.repoUrl,
  });
  task.stage = "plan";
  task.completed.push("Clarify acceptance criteria");
  task.notes.push(`Plan for: ${input.objective}`);

  if (input.localPath || !input.repoUrl) {
    await factoryInspectRepo(task.id, input.localPath);
  }

  if (input.snippet) {
    if (!input.approveMutations) {
      advanceFactoryTask(task.id, {
        requireApproval: true,
        note: "Snippet validation allowed; write-to-repo blocked until approveMutations=true.",
      });
    }
    await factoryValidateCode(task.id, input.snippet);
  }

  if (!task.pendingHumanApproval && task.stage !== "blocked") {
    task.stage = "review";
    task.notes.push("Pipeline ready for human review / PR stage.");
  }
  task.updatedAt = new Date().toISOString();
  return tasks.get(task.id)!;
}
