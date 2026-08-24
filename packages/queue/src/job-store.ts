/**
 * Phase 1 foundation gap: the queue's job state lived only in a module-level
 * Map — lost on every restart, and invisible to a second process/instance.
 * This makes the job store pluggable: InMemoryJobStore (existing behavior,
 * unchanged) and a new RedisJobStore that persists job state as a Redis hash
 * per job plus a sorted set index by createdAt.
 *
 * HONESTY NOTE: same caveat as packages/cache and packages/storage — the
 * Redis backend is written against ioredis's documented API but not verified
 * against a live Redis server in this environment. What IS verified: the
 * in-memory store's behavior is unchanged from before (it's the same code,
 * just moved behind this interface), and the overall queue's enqueue/process/
 * complete flow was smoke-tested against a running server in an earlier
 * session (factory tasks use a separate, already-verified state machine —
 * this general-purpose queue currently has no route consumer yet, so it
 * hasn't been exercised end-to-end through an HTTP request).
 */
import type { Job, JobStatus } from "./memory-queue";

export interface JobStore {
  save(job: Job): Promise<void>;
  get(id: string): Promise<Job | undefined>;
  list(filter?: { status?: JobStatus }): Promise<Job[]>;
}

export class InMemoryJobStore implements JobStore {
  private jobs = new Map<string, Job>();

  async save(job: Job): Promise<void> {
    this.jobs.set(job.id, job);
  }

  async get(id: string): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async list(filter?: { status?: JobStatus }): Promise<Job[]> {
    const all = Array.from(this.jobs.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return filter?.status ? all.filter((j) => j.status === filter.status) : all;
  }

  /** Not part of JobStore — lets memory-queue.ts iterate queued jobs directly for the processing loop. */
  values(): IterableIterator<Job> {
    return this.jobs.values();
  }
}

type RedisLike = {
  hset(key: string, field: string, value: string): Promise<unknown>;
  hget(key: string, field: string): Promise<string | null>;
  zadd(key: string, score: number, member: string): Promise<unknown>;
  zrevrange(key: string, start: number, stop: number): Promise<string[]>;
};

class RedisJobStore implements JobStore {
  constructor(private client: RedisLike) {}

  async save(job: Job): Promise<void> {
    await this.client.hset(`job:${job.id}`, "data", JSON.stringify(job));
    await this.client.zadd("jobs:index", new Date(job.createdAt).getTime(), job.id);
  }

  async get(id: string): Promise<Job | undefined> {
    const raw = await this.client.hget(`job:${id}`, "data");
    return raw ? (JSON.parse(raw) as Job) : undefined;
  }

  async list(filter?: { status?: JobStatus }): Promise<Job[]> {
    const ids = await this.client.zrevrange("jobs:index", 0, 199);
    const jobs: Job[] = [];
    for (const id of ids) {
      const job = await this.get(id);
      if (job) jobs.push(job);
    }
    return filter?.status ? jobs.filter((j) => j.status === filter.status) : jobs;
  }
}

let cachedStore: JobStore | null = null;
let storeTried = false;
const fallbackStore = new InMemoryJobStore();

export async function getJobStore(): Promise<JobStore> {
  if (storeTried) return cachedStore ?? fallbackStore;
  storeTried = true;
  if (!process.env.REDIS_URL) return fallbackStore;
  try {
    const mod = await import("ioredis");
    const Redis = mod.default;
    const client = new Redis(process.env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
    await client.connect();
    cachedStore = new RedisJobStore(client as unknown as RedisLike);
    return cachedStore;
  } catch {
    return fallbackStore;
  }
}

export function queueBackendHint(): "redis" | "memory" {
  return process.env.REDIS_URL ? "redis" : "memory";
}
