/**
 * In-memory TTL cache — optional Redis later via same interface.
 */

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export function cacheSet<T>(key: string, value: T, ttlMs = 60_000): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function cacheGet<T>(key: string): T | undefined {
  const e = store.get(key);
  if (!e) return undefined;
  if (Date.now() > e.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return e.value as T;
}

export function cacheDel(key: string): void {
  store.delete(key);
}

export function cacheClear(): void {
  store.clear();
}

export function cacheStats(): { keys: number } {
  // purge expired
  const now = Date.now();
  for (const [k, v] of store) {
    if (now > v.expiresAt) store.delete(k);
  }
  return { keys: store.size };
}

export async function cacheGetOrSet<T>(
  key: string,
  ttlMs: number,
  factory: () => Promise<T>
): Promise<T> {
  const hit = cacheGet<T>(key);
  if (hit !== undefined) return hit;
  const value = await factory();
  cacheSet(key, value, ttlMs);
  return value;
}

const MAX_KEYS = Number(process.env.CACHE_MAX_KEYS ?? 5000);

/** Evict expired then oldest if over capacity */
export function cacheSetBounded<T>(key: string, value: T, ttlMs = 60_000): void {
  cacheSet(key, value, ttlMs);
  const { keys } = cacheStats();
  if (keys > MAX_KEYS) {
    // delete first inserted (Map insertion order)
    const first = store.keys().next().value;
    if (first !== undefined) store.delete(first);
  }
}
