/**
 * BullMQ backend — used when REDIS_URL is set and bullmq/ioredis are installed.
 */

import type { QueueLane } from "./memory-queue";

export interface BullJobHandle {
  id: string;
  name: string;
  backend: "bullmq";
}

interface MinimalJobOpts {
  priority?: number;
  attempts?: number;
  backoff?: { type: string; delay: number };
  removeOnComplete?: number;
  removeOnFail?: number;
}

let queueInstance: { add: (name: string, data: unknown, opts?: MinimalJobOpts) => Promise<{ id?: string }> } | null = null;
let workerStarted = false;

export async function initBullMQ(): Promise<boolean> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return false;

  try {
    const bullmq = await import("bullmq");
    const IORedis = (await import("ioredis")).default;

    const connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    const queue = new bullmq.Queue("superior-ai", { connection });
    queueInstance = queue;

    if (!workerStarted && process.env.SUPERIOR_WORKER === "1") {
      const worker = new bullmq.Worker(
        "superior-ai",
        async (job) => {
          const { runJobHandler } = await import("./job-handlers");
          return runJobHandler(job.name, job.data as Record<string, unknown>);
        },
        { connection: connection.duplicate(), concurrency: Number(process.env.WORKER_CONCURRENCY ?? 2) }
      );
      worker.on("completed", (job) => console.log(`[bullmq] completed ${job.id} ${job.name}`));
      worker.on("failed", (job, err) => console.error(`[bullmq] failed ${job?.id}`, err.message));
      workerStarted = true;
      console.log("[bullmq] worker listening on queue superior-ai");
    }

    console.log("[bullmq] connected to Redis");
    return true;
  } catch (err) {
    console.warn(
      "[bullmq] unavailable — install bullmq + ioredis or unset REDIS_URL. Falling back to memory.",
      err instanceof Error ? err.message : err
    );
    return false;
  }
}

export async function bullEnqueue(
  name: string,
  data: Record<string, unknown>,
  opts?: { priority?: number; lane?: QueueLane; attempts?: number }
): Promise<BullJobHandle | null> {
  if (!queueInstance) {
    const ok = await initBullMQ();
    if (!ok || !queueInstance) return null;
  }
  const job = await queueInstance.add(name, data, {
    priority: 100 - (opts?.priority ?? 50),
    attempts: opts?.attempts ?? 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  });
  return { id: String(job.id ?? ""), name, backend: "bullmq" };
}

export function isBullReady(): boolean {
  return queueInstance !== null;
}
