/**
 * Unified queue: BullMQ when Redis available, else memory
 */

import type { QueueJob, QueueLane } from "./memory-queue";
import {
  enqueue as memEnqueue,
  getJob as memGetJob,
  listJobs as memListJobs,
  getQueueStats as memStats,
  registerHandler as memRegisterHandler,
} from "./memory-queue";
import { initBullMQ, bullEnqueue, isBullReady } from "./bullmq-backend";
import { runJobHandler } from "./job-handlers";

let backend: "redis" | "memory" = "memory";
let initialized = false;

export async function initQueue(): Promise<{ backend: "redis" | "memory" }> {
  if (initialized) return { backend };
  const bull = await initBullMQ();
  backend = bull ? "redis" : "memory";
  initialized = true;

  // Always register memory handlers for in-process fallback
  memRegisterHandler("echo", async (job) => {
    job.payload.result = await runJobHandler("echo", job.payload);
  });
  memRegisterHandler("orchestrate_async", async (job) => {
    job.payload.result = await runJobHandler("orchestrate_async", job.payload);
  });
  memRegisterHandler("url_audit_async", async (job) => {
    job.payload.result = await runJobHandler("url_audit_async", job.payload);
  });
  memRegisterHandler("embed_index", async (job) => {
    job.payload.result = await runJobHandler("embed_index", job.payload);
  });

  return { backend };
}

export function registerHandler(type: string, handler: (job: QueueJob) => Promise<void>): void {
  memRegisterHandler(type, handler);
}

export function enqueue(input: {
  type: string;
  payload?: Record<string, unknown>;
  lane?: QueueLane;
  priority?: number;
  maxAttempts?: number;
}): QueueJob {
  // Fire-and-forget bull attempt
  if (backend === "redis" || process.env.REDIS_URL) {
    void bullEnqueue(input.type, input.payload ?? {}, {
      priority: input.priority,
      lane: input.lane,
      attempts: input.maxAttempts,
    }).then((handle) => {
      if (handle) console.log(`[queue] bull job ${handle.id} ${handle.name}`);
    });
  }
  return memEnqueue(input);
}

export function getJob(id: string): QueueJob | undefined {
  return memGetJob(id);
}

export function listJobs(filter?: { status?: QueueJob["status"]; lane?: QueueLane }): QueueJob[] {
  return memListJobs(filter);
}

export function getQueueStats(): Record<string, number> {
  return memStats();
}

export function getQueueBackend(): "redis" | "memory" {
  return isBullReady() ? "redis" : backend;
}

export async function startWorker(): Promise<void> {
  await initQueue();
  // Bull worker starts inside initBullMQ when SUPERIOR_WORKER=1
  console.log(`[worker] backend=${getQueueBackend()}`);
}

export function enqueueOrchestration(payload: Record<string, unknown>, priority = 70) {
  return enqueue({
    type: "orchestrate_async",
    payload,
    lane: "long_running",
    priority,
    maxAttempts: 2,
  });
}
