/**
 * Token-bucket rate limiter (in-memory; use Redis in multi-instance prod)
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec?: number;
  limit: number;
}

interface Bucket {
  tokens: number;
  updatedAt: number;
}

const buckets = new Map<string, Bucket>();

export function rateLimit(input: {
  key: string;
  limit: number;
  windowSec: number;
}): RateLimitResult {
  const now = Date.now();
  const rate = input.limit / input.windowSec; // tokens per second
  let bucket = buckets.get(input.key);
  if (!bucket) {
    bucket = { tokens: input.limit, updatedAt: now };
    buckets.set(input.key, bucket);
  }

  const elapsed = (now - bucket.updatedAt) / 1000;
  bucket.tokens = Math.min(input.limit, bucket.tokens + elapsed * rate);
  bucket.updatedAt = now;

  if (bucket.tokens < 1) {
    const retryAfterSec = Math.ceil((1 - bucket.tokens) / rate);
    return { allowed: false, remaining: 0, retryAfterSec, limit: input.limit };
  }

  bucket.tokens -= 1;
  return { allowed: true, remaining: Math.floor(bucket.tokens), limit: input.limit };
}

/** Common presets */
export function limitApi(ip: string): RateLimitResult {
  return rateLimit({ key: `api:${ip}`, limit: 120, windowSec: 60 });
}

export function limitAuth(ip: string): RateLimitResult {
  return rateLimit({ key: `auth:${ip}`, limit: 20, windowSec: 60 });
}

export function limitOrchestrate(userId: string): RateLimitResult {
  return rateLimit({ key: `orch:${userId}`, limit: 30, windowSec: 60 });
}
