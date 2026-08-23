import { runJobHandler } from "./job-handlers";

export type JobStatus = "queued" | "running" | "succeeded" | "failed";

export interface Job {
  id: string;
  name: string;
  data: Record<string, unknown>;
  status: JobStatus;
  result?: Record<string, unknown>;
  error?: string;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  updatedAt: string;
}

const jobs = new Map<string, Job>();
let processing = false;

export function enqueue(name: string, data: Record<string, unknown> = {}, maxAttempts = 3): Job {
  const now = new Date().toISOString();
  const job: Job = {
    id: `job_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    data,
    status: "queued",
    attempts: 0,
    maxAttempts,
    createdAt: now,
    updatedAt: now,
  };
  jobs.set(job.id, job);
  // Fire-and-forget processing loop; safe to call repeatedly (guarded by `processing`).
  void processQueue();
  return job;
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

export function listJobs(filter?: { status?: JobStatus }): Job[] {
  const all = Array.from(jobs.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return filter?.status ? all.filter((j) => j.status === filter.status) : all;
}

async function processQueue(): Promise<void> {
  if (processing) return;
  processing = true;
  try {
    for (const job of jobs.values()) {
      if (job.status !== "queued") continue;
      job.status = "running";
      job.attempts += 1;
      job.updatedAt = new Date().toISOString();
      try {
        job.result = await runJobHandler(job.name, job.data);
        job.status = "succeeded";
      } catch (err) {
        job.error = err instanceof Error ? err.message : String(err);
        job.status = job.attempts >= job.maxAttempts ? "failed" : "queued";
      }
      job.updatedAt = new Date().toISOString();
    }
  } finally {
    processing = false;
  }
}
