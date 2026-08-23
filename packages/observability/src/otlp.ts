/**
 * OTLP HTTP/JSON span exporter (OpenTelemetry Protocol)
 * Set OTEL_EXPORTER_OTLP_ENDPOINT e.g. http://localhost:4318
 */

import type { SpanContext } from "./tracing";

export interface OtlpConfig {
  endpoint: string; // e.g. http://jaeger:4318
  serviceName?: string;
}

function getConfig(): OtlpConfig | null {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint) return null;
  return {
    endpoint: endpoint.replace(/\/$/, ""),
    serviceName: process.env.OTEL_SERVICE_NAME || "superior-ai",
  };
}

export function isOtlpConfigured(): boolean {
  return getConfig() !== null;
}

/** Convert internal span to OTLP-ish JSON body (simplified traces export) */
function toOtlpPayload(spans: SpanContext[], serviceName: string) {
  return {
    resourceSpans: [
      {
        resource: {
          attributes: [
            { key: "service.name", value: { stringValue: serviceName } },
            { key: "telemetry.sdk.name", value: { stringValue: "superior-ai-lite" } },
          ],
        },
        scopeSpans: [
          {
            scope: { name: "superior-ai", version: "0.1.0" },
            spans: spans.map((s) => ({
              traceId: s.traceId,
              spanId: s.spanId,
              name: s.name,
              kind: 1,
              startTimeUnixNano: String(s.startMs * 1e6),
              endTimeUnixNano: String((s.startMs + (Date.now() - s.startMs)) * 1e6),
              attributes: Object.entries(s.attributes).map(([key, value]) => ({
                key,
                value:
                  typeof value === "string"
                    ? { stringValue: value }
                    : typeof value === "boolean"
                      ? { boolValue: value }
                      : { doubleValue: Number(value) },
              })),
              status: {
                code: s.status === "error" ? 2 : 1,
                message: s.errorMessage,
              },
            })),
          },
        ],
      },
    ],
  };
}

const buffer: SpanContext[] = [];

export function bufferSpanForOtlp(span: SpanContext): void {
  if (!isOtlpConfigured()) return;
  buffer.push(span);
  if (buffer.length >= 10) {
    void flushOtlp();
  }
}

export async function flushOtlp(): Promise<{ ok: boolean; sent: number; error?: string }> {
  const cfg = getConfig();
  if (!cfg || buffer.length === 0) {
    return { ok: true, sent: 0 };
  }

  const batch = buffer.splice(0, buffer.length);
  const url = `${cfg.endpoint}/v1/traces`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.OTEL_EXPORTER_OTLP_HEADERS
          ? Object.fromEntries(
              process.env.OTEL_EXPORTER_OTLP_HEADERS.split(",").map((h) => {
                const [k, ...v] = h.split("=");
                return [k!.trim(), v.join("=").trim()];
              })
            )
          : {}),
      },
      body: JSON.stringify(toOtlpPayload(batch, cfg.serviceName || "superior-ai")),
    });
    if (!res.ok) {
      // put back on failure
      buffer.unshift(...batch);
      return { ok: false, sent: 0, error: `OTLP HTTP ${res.status}` };
    }
    return { ok: true, sent: batch.length };
  } catch (err) {
    buffer.unshift(...batch);
    return { ok: false, sent: 0, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Hook into endSpan — call from tracing layer */
export function exportSpan(span: SpanContext): void {
  bufferSpanForOtlp(span);
  if (process.env.OTEL_LOG_SPANS === "1") {
    // already logged in tracing
  }
}
