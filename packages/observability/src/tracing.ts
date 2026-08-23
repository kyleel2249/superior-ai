export interface Span {
  id: string;
  name: string;
  startedAt: string;
  durationMs: number;
  ok: boolean;
  attributes?: Record<string, unknown>;
}

const MAX_SPANS = 500;
const spans: Span[] = [];
const counters = new Map<string, number>();
const latencies: number[] = [];

export function recordSpan(name: string, durationMs: number, ok: boolean, attributes?: Record<string, unknown>): Span {
  const span: Span = { id: `sp_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, name, startedAt: new Date().toISOString(), durationMs, ok, attributes };
  spans.push(span);
  if (spans.length > MAX_SPANS) spans.shift();
  counters.set(name, (counters.get(name) ?? 0) + 1);
  latencies.push(durationMs);
  if (latencies.length > 2000) latencies.shift();
  if (process.env.OTEL_LOG_SPANS === "1") console.log(JSON.stringify({ type: "span", ...span }));
  return span;
}

/** Wraps an async function, recording a span automatically. */
export async function withSpan<T>(name: string, fn: () => Promise<T>, attributes?: Record<string, unknown>): Promise<T> {
  const started = Date.now();
  try {
    const result = await fn();
    recordSpan(name, Date.now() - started, true, attributes);
    return result;
  } catch (err) {
    recordSpan(name, Date.now() - started, false, { ...attributes, error: err instanceof Error ? err.message : String(err) });
    throw err;
  }
}

export function getRecentSpans(limit = 20): Span[] {
  return spans.slice(-limit).reverse();
}

export function getMetricsSnapshot() {
  const sorted = [...latencies].sort((a, b) => a - b);
  const p = (q: number) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))]! : 0);
  return {
    totalSpans: spans.length,
    countsByName: Object.fromEntries(counters.entries()),
    latencyMs: { p50: p(0.5), p90: p(0.9), p99: p(0.99), count: latencies.length },
  };
}
