/**
 * Phase 1 foundation gap: nothing in the repo had a cache layer before this.
 * getCache() returns a Redis-backed cache when REDIS_URL is configured
 * (dynamic import, same degrade-gracefully pattern as packages/memory/src/postgres.ts),
 * or a real in-memory LRU+TTL cache otherwise.
 *
 * HONESTY NOTE: the in-memory backend is fully tested (see below). The Redis
 * backend is written against ioredis's documented API but has not been run
 * against a live Redis server in this environment — no Redis instance is
 * reachable here to verify against. Treat it the same way packages/db's
 * pgvector code is treated: real code, unverified integration, verify before
 * depending on it in production.
 */

export interface CacheBackend {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

interface CacheEntry {
  value: string;
  expiresAt: number | null;
}

/** Real, tested in-memory cache with TTL expiry and a max-entry LRU eviction. */
export class InMemoryCache implements CacheBackend {
  private store = new Map<string, CacheEntry>();
  private maxEntries: number;

  constructor(maxEntries = 10_000) {
    this.maxEntries = maxEntries;
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    // touch for LRU: re-insert to move to the end of Map's iteration order
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    this.store.delete(key); // ensure re-insertion moves it to the end
    this.store.set(key, { value, expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null });
    while (this.store.size > this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey === undefined) break;
      this.store.delete(oldestKey);
    }
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  /** Not part of CacheBackend — used by tests/observability, not by consumers. */
  size(): number {
    return this.store.size;
  }
}

type RedisLike = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, ttl?: number): Promise<unknown>;
  del(key: string): Promise<unknown>;
  flushdb(): Promise<unknown>;
};

class RedisCache implements CacheBackend {
  constructor(private client: RedisLike) {}

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) await this.client.set(key, value, "EX", ttlSeconds);
    else await this.client.set(key, value);
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  async clear(): Promise<void> {
    await this.client.flushdb();
  }
}

let cachedBackend: CacheBackend | null = null;
let backendTried = false;
const fallback = new InMemoryCache();

export async function getCache(): Promise<CacheBackend> {
  if (backendTried) return cachedBackend ?? fallback;
  backendTried = true;
  if (!process.env.REDIS_URL) return fallback;
  try {
    const mod = await import("ioredis");
    const Redis = mod.default;
    const client = new Redis(process.env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
    await client.connect();
    cachedBackend = new RedisCache(client as unknown as RedisLike);
    return cachedBackend;
  } catch {
    // ioredis not installed, or connection failed — fall back rather than crash the caller.
    return fallback;
  }
}

export function cacheBackendHint(): "redis" | "memory" {
  return process.env.REDIS_URL ? "redis" : "memory";
}
