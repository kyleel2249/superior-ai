/**
 * Simple agent work scheduler — FIFO with priority.
 */

export interface ScheduledJob {
  id: string;
  agentDefinitionId: string;
  objective: string;
  priority: number;
  status: "queued" | "running" | "done" | "failed";
  createdAt: string;
  error?: string;
}

const queue: ScheduledJob[] = [];
let processing = false;

function jid() {
  return `sjob_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`;
}

export function enqueueAgentJob(input: {
  agentDefinitionId: string;
  objective: string;
  priority?: number;
}): ScheduledJob {
  const job: ScheduledJob = {
    id: jid(),
    agentDefinitionId: input.agentDefinitionId,
    objective: input.objective,
    priority: input.priority ?? 50,
    status: "queued",
    createdAt: new Date().toISOString(),
  };
  queue.push(job);
  queue.sort((a, b) => b.priority - a.priority);
  void processQueue();
  return job;
}

export function listScheduledJobs(): ScheduledJob[] {
  return [...queue];
}

async function processQueue(): Promise<void> {
  if (processing) return;
  processing = true;
  try {
    while (true) {
      const job = queue.find((j) => j.status === "queued");
      if (!job) break;
      job.status = "running";
      try {
        const { runAgentTask } = await import("./runtime");
        await runAgentTask(job.agentDefinitionId, job.objective);
        job.status = "done";
      } catch (err) {
        job.status = "failed";
        job.error = err instanceof Error ? err.message : String(err);
      }
    }
  } finally {
    processing = false;
  }
}
