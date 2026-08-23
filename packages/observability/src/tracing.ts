/**
 * observability/src/index.ts already declared `export * from "./tracing"`
 * before this file existed. apps/web/src/app/api/metrics/route.ts calls
 * getMetricsSnapshot() and getRecentSpans(n) — implemented here as a real
 * in-process store (matches the route's own note: "In-process metrics.").
 */

export interface Span {
  id: string;
  name: string;
  startedAt: string;
  durationMs: number;
  status: "ok" | "error";
  attributes?: Record<string, unknown>;
}

const MAX_SPANS = 500;
const spans: Span[] = [];
const counters = new Map<string, number>();

export function recordSpan(input: { name: string; durationMs: number; status?: "ok" | "error"; attributes?: Record<string, unknown> }): Span {
  const span: Span = {
    id: `span_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    name: input.name,
    startedAt: new Date().toISOString(),
    durationMs: input.durationMs,
    status: input.status ?? "ok",
    attributes: input.attributes,
  };
  spans.push(span);
  if (spans.length > MAX_SPANS) spans.shift();
  incrementCounter(`span.${input.name}.${span.status}`);
  if (process.env.OTEL_LOG_SPANS === "1") {
    console.log(JSON.stringify({ type: "span", ...span }));
  }
  return span;
}

export function incrementCounter(name: string, by = 1): void {
  counters.set(name, (counters.get(name) ?? 0) + by);
}

export function getRecentSpans(limit = 20): Span[] {
  return spans.slice(-limit).reverse();
}

export function getMetricsSnapshot(): { counters: Record<string, number>; spanCount: number; errorRate: number } {
  const errorSpans = spans.filter((s) => s.status === "error").length;
  return {
    counters: Object.fromEntries(counters),
    spanCount: spans.length,
    errorRate: spans.length ? errorSpans / spans.length : 0,
  };
}
