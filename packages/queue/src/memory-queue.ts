import { runJobHandler } from "./job-handlers";
import { getJobStore } from "./job-store";

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

let processing = false;

/**
 * API is async now (was sync) since the store may be Redis-backed. No
 * existing route imports this package yet, so this is a safe breaking
 * change — nothing to migrate.
 */
export async function enqueue(name: string, data: Record<string, unknown> = {}, maxAttempts = 3): Promise<Job> {
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
  const store = await getJobStore();
  await store.save(job);
  // Fire-and-forget processing loop; safe to call repeatedly (guarded by `processing`).
  void processQueue();
  return job;
}

export async function getJob(id: string): Promise<Job | undefined> {
  const store = await getJobStore();
  return store.get(id);
}

export async function listJobs(filter?: { status?: JobStatus }): Promise<Job[]> {
  const store = await getJobStore();
  return store.list(filter);
}

async function processQueue(): Promise<void> {
  if (processing) return;
  processing = true;
  try {
    const store = await getJobStore();
    const queued = await store.list({ status: "queued" });
    for (const job of queued) {
      job.status = "running";
      job.attempts += 1;
      job.updatedAt = new Date().toISOString();
      await store.save(job);
      try {
        job.result = await runJobHandler(job.name, job.data);
        job.status = "succeeded";
      } catch (err) {
        job.error = err instanceof Error ? err.message : String(err);
        job.status = job.attempts >= job.maxAttempts ? "failed" : "queued";
      }
      job.updatedAt = new Date().toISOString();
      await store.save(job);
    }
  } finally {
    processing = false;
  }
}
