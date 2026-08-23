import { runJobHandler } from "./job-handlers";

export type JobStatus = "queued" | "running" | "succeeded" | "failed";

export interface Job {
  id: string;
  name: string;
  data: Record<string, unknown>;
  status: JobStatus;
  result?: Record<string, unknown>;
  error?: string;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  attempts: number;
}

const jobs = new Map<string, Job>();
const MAX_JOBS = 5000;

function prune() {
  if (jobs.size <= MAX_JOBS) return;
  const oldest = Array.from(jobs.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
  if (oldest) jobs.delete(oldest.id);
}

/** Enqueues and immediately processes in-process (no external broker). Good enough for a single Next.js instance; swap for a real queue (SQS/BullMQ) once this needs to survive restarts or scale out. */
export async function enqueueJob(name: string, data: Record<string, unknown> = {}): Promise<Job> {
  const job: Job = { id: `job_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, name, data, status: "queued", createdAt: new Date().toISOString(), attempts: 0 };
  jobs.set(job.id, job);
  prune();
  void processJob(job.id);
  return job;
}

async function processJob(id: string): Promise<void> {
  const job = jobs.get(id);
  if (!job) return;
  job.status = "running";
  job.startedAt = new Date().toISOString();
  job.attempts += 1;
  try {
    job.result = await runJobHandler(job.name, job.data);
    job.status = "succeeded";
  } catch (err) {
    job.status = "failed";
    job.error = err instanceof Error ? err.message : String(err);
  } finally {
    job.finishedAt = new Date().toISOString();
  }
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

export function listJobs(filter?: { status?: JobStatus; limit?: number }): Job[] {
  let list = Array.from(jobs.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (filter?.status) list = list.filter((j) => j.status === filter.status);
  return list.slice(0, filter?.limit ?? 100);
}
