interface Bucket { count: number; windowStart: number }
const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec?: number;
}

/** Simple fixed-window in-process limiter. Fine for a single instance; swap for Redis/Upstash at multi-instance scale. */
export function limitApi(key: string, limit = 60, windowMs = 60_000): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStart >= windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1 };
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return { allowed: false, remaining: 0, retryAfterSec: Math.ceil((bucket.windowStart + windowMs - now) / 1000) };
  }
  return { allowed: true, remaining: limit - bucket.count };
}
