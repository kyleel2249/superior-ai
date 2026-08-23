/**
 * Redis-backed rate limiter for multi-replica deployments.
 * Falls back to in-memory token bucket when REDIS_URL is unset.
 */

import { rateLimit, type RateLimitResult } from "./rate-limit";

async function redisIncr(key: string, windowSec: number): Promise<number | null> {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  try {
    const Redis = (await import("ioredis").catch(() => null))?.default;
    if (!Redis) return null;

    // Reuse a global connection
    const g = globalThis as unknown as { __superiorRedis?: InstanceType<typeof Redis> };
    if (!g.__superiorRedis) {
      g.__superiorRedis = new Redis(url, {
        maxRetriesPerRequest: 1,
        enableReadyCheck: false,
        lazyConnect: true,
      });
      await g.__superiorRedis.connect().catch(() => null);
    }
    const client = g.__superiorRedis;
    if (!client) return null;

    const redisKey = `rl:${key}`;
    const n = await client.incr(redisKey);
    if (n === 1) {
      await client.expire(redisKey, windowSec);
    }
    return n;
  } catch {
    return null;
  }
}

export async function rateLimitDistributed(input: {
  key: string;
  limit: number;
  windowSec: number;
}): Promise<RateLimitResult & { backend: "redis" | "memory" }> {
  const count = await redisIncr(input.key, input.windowSec);
  if (count === null) {
    return { ...rateLimit(input), backend: "memory" };
  }

  if (count > input.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: input.windowSec,
      limit: input.limit,
      backend: "redis",
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, input.limit - count),
    limit: input.limit,
    backend: "redis",
  };
}

export async function limitApiDistributed(ip: string) {
  return rateLimitDistributed({ key: `api:${ip}`, limit: 120, windowSec: 60 });
}

export async function limitOrchestrateDistributed(userId: string) {
  return rateLimitDistributed({ key: `orch:${userId}`, limit: 30, windowSec: 60 });
}

export async function limitAuthDistributed(ip: string) {
  return rateLimitDistributed({ key: `auth:${ip}`, limit: 20, windowSec: 60 });
}
