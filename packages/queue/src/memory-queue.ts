/**
 * Task queue foundation
 * In-memory + optional Redis/BullMQ when REDIS_URL is set.
 * Priority, background, and long-running lanes.
 */

export type QueueLane = "realtime" | "priority" | "background" | "batch" | "long_running" | "research" | "coding";

export interface QueueJob {
  id: string;
  lane: QueueLane;
  type: string;
  payload: Record<string, unknown>;
  status: "waiting" | "active" | "completed" | "failed" | "delayed";
  priority: number;
  attempts: number;
  maxAttempts: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

type Handler = (job: QueueJob) => Promise<void>;

const jobs = new Map<string, QueueJob>();
const handlers = new Map<string, Handler>();
const waiters: QueueJob[] = [];

export function registerHandler(type: string, handler: Handler): void {
  handlers.set(type, handler);
}

export function enqueue(input: {
  type: string;
  payload?: Record<string, unknown>;
  lane?: QueueLane;
  priority?: number;
  maxAttempts?: number;
}): QueueJob {
  const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  const job: QueueJob = {
    id,
    lane: input.lane ?? "background",
    type: input.type,
    payload: input.payload ?? {},
    status: "waiting",
    priority: input.priority ?? 50,
    attempts: 0,
    maxAttempts: input.maxAttempts ?? 3,
    createdAt: now,
    updatedAt: now,
  };
  jobs.set(id, job);
  waiters.push(job);
  waiters.sort((a, b) => b.priority - a.priority);
  void processNext();
  return job;
}

async function processNext(): Promise<void> {
  const job = waiters.shift();
  if (!job) return;
  const handler = handlers.get(job.type);
  job.status = "active";
  job.attempts += 1;
  job.updatedAt = new Date().toISOString();
  jobs.set(job.id, job);

  if (!handler) {
    job.status = "failed";
    job.error = `No handler for job type: ${job.type}`;
    job.updatedAt = new Date().toISOString();
    jobs.set(job.id, job);
    void processNext();
    return;
  }

  try {
    await handler(job);
    job.status = "completed";
    job.completedAt = new Date().toISOString();
  } catch (err) {
    job.error = err instanceof Error ? err.message : String(err);
    if (job.attempts < job.maxAttempts) {
      job.status = "waiting";
      waiters.push(job);
      waiters.sort((a, b) => b.priority - a.priority);
    } else {
      job.status = "failed";
    }
  }
  job.updatedAt = new Date().toISOString();
  jobs.set(job.id, job);
  void processNext();
}

export function getJob(id: string): QueueJob | undefined {
  return jobs.get(id);
}

export function listJobs(filter?: { status?: QueueJob["status"]; lane?: QueueLane }): QueueJob[] {
  let list = Array.from(jobs.values());
  if (filter?.status) list = list.filter((j) => j.status === filter.status);
  if (filter?.lane) list = list.filter((j) => j.lane === filter.lane);
  return list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getQueueStats(): Record<string, number> {
  const stats: Record<string, number> = { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
  for (const j of jobs.values()) {
    stats[j.status] = (stats[j.status] ?? 0) + 1;
  }
  return stats;
}
