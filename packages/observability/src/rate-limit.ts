/**
 * observability/src/index.ts already declared `export * from "./rate-limit"`
 * before this file existed. apps/web/src/app/api/exec/route.ts calls
 * limitApi(ip) and expects { allowed, retryAfterSec }.
 */

const hits = new Map<string, { count: number; windowStart: number }>();

const DEFAULT_LIMIT = Number(process.env.RATE_LIMIT_MAX ?? 100);
const DEFAULT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec?: number;
}

export function limitApi(key: string, limit = DEFAULT_LIMIT, windowMs = DEFAULT_WINDOW_MS): RateLimitResult {
  const now = Date.now();
  const slot = hits.get(key);
  if (!slot || now - slot.windowStart > windowMs) {
    hits.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1 };
  }
  slot.count += 1;
  if (slot.count > limit) {
    return { allowed: false, remaining: 0, retryAfterSec: Math.ceil((slot.windowStart + windowMs - now) / 1000) };
  }
  return { allowed: true, remaining: limit - slot.count };
}
