/**
 * Lightweight OpenTelemetry-compatible tracing/metrics foundation.
 * Works without OTEL SDK installed; flushes structured spans to console/JSON.
 * When @opentelemetry/api is present, can be upgraded to real exporters.
 */

export interface SpanContext {
  traceId: string;
  spanId: string;
  name: string;
  startMs: number;
  attributes: Record<string, string | number | boolean>;
  events: Array<{ name: string; at: number; attrs?: Record<string, unknown> }>;
  status: "ok" | "error";
  errorMessage?: string;
}

function hexId(bytes = 8): string {
  const arr = new Uint8Array(bytes);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < bytes; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

const activeSpans: SpanContext[] = [];
const completedSpans: SpanContext[] = [];
const counters = new Map<string, number>();
const histograms = new Map<string, number[]>();

export function startSpan(name: string, attributes: Record<string, string | number | boolean> = {}): SpanContext {
  const span: SpanContext = {
    traceId: hexId(16),
    spanId: hexId(8),
    name,
    startMs: Date.now(),
    attributes,
    events: [],
    status: "ok",
  };
  activeSpans.push(span);
  return span;
}

export function addEvent(span: SpanContext, name: string, attrs?: Record<string, unknown>): void {
  span.events.push({ name, at: Date.now(), attrs });
}

export function endSpan(span: SpanContext, error?: Error): void {
  if (error) {
    span.status = "error";
    span.errorMessage = error.message;
  }
  const idx = activeSpans.indexOf(span);
  if (idx >= 0) activeSpans.splice(idx, 1);
  completedSpans.push(span);
  if (completedSpans.length > 500) completedSpans.shift();

  const duration = Date.now() - span.startMs;
  recordHistogram(`span.${span.name}.ms`, duration);
  incrementCounter(`span.${span.name}.${span.status}`);

  // OTLP buffer (async, non-blocking)
  void import("./otlp")
    .then((m) => m.exportSpan(span))
    .catch(() => undefined);

  if (process.env.OTEL_LOG_SPANS === "1") {
    console.log(
      JSON.stringify({
        type: "span",
        traceId: span.traceId,
        spanId: span.spanId,
        name: span.name,
        durationMs: duration,
        status: span.status,
        attributes: span.attributes,
        error: span.errorMessage,
      })
    );
  }
}

export async function withSpan<T>(
  name: string,
  attributes: Record<string, string | number | boolean>,
  fn: (span: SpanContext) => Promise<T>
): Promise<T> {
  const span = startSpan(name, attributes);
  try {
    const result = await fn(span);
    endSpan(span);
    return result;
  } catch (err) {
    endSpan(span, err instanceof Error ? err : new Error(String(err)));
    throw err;
  }
}

export function incrementCounter(name: string, by = 1): void {
  counters.set(name, (counters.get(name) ?? 0) + by);
}

export function recordHistogram(name: string, value: number): void {
  const arr = histograms.get(name) ?? [];
  arr.push(value);
  if (arr.length > 200) arr.shift();
  histograms.set(name, arr);
}

export function getMetricsSnapshot(): {
  counters: Record<string, number>;
  histograms: Record<string, { count: number; avg: number; p95: number }>;
  activeSpans: number;
  recentSpans: number;
} {
  const histOut: Record<string, { count: number; avg: number; p95: number }> = {};
  for (const [k, vals] of histograms) {
    const sorted = [...vals].sort((a, b) => a - b);
    const avg = vals.reduce((s, v) => s + v, 0) / (vals.length || 1);
    const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? sorted[sorted.length - 1] ?? 0;
    histOut[k] = { count: vals.length, avg: Math.round(avg * 100) / 100, p95 };
  }
  return {
    counters: Object.fromEntries(counters),
    histograms: histOut,
    activeSpans: activeSpans.length,
    recentSpans: completedSpans.length,
  };
}

export function getRecentSpans(limit = 20): SpanContext[] {
  return completedSpans.slice(-limit);
}
