/**
 * Lightweight model benchmark scaffold — latency + basic response only.
 * Does not invent quality scores; records observed latency and success.
 */

import type { ProviderId } from "@superior-ai/core";
import { getAdapter } from "./providers";
import { getCredentials } from "./credentials";
import { modelRegistry } from "./registry/model-registry";

export interface BenchmarkResult {
  provider: ProviderId;
  modelId: string;
  ok: boolean;
  latencyMs?: number;
  error?: string;
  sampleLength?: number;
  observedAt: string;
}

export async function benchmarkModel(
  provider: ProviderId,
  modelId: string
): Promise<BenchmarkResult> {
  const observedAt = new Date().toISOString();
  const creds = getCredentials(provider);
  if (!creds.apiKey && provider !== "local") {
    return {
      provider,
      modelId,
      ok: false,
      error: "CONFIGURATION_REQUIRED",
      observedAt,
    };
  }
  const adapter = getAdapter(provider);
  adapter.setCredentials(creds);
  const start = Date.now();
  try {
    const res = await adapter.chat({
      model: modelId,
      messages: [{ role: "user", content: "Reply with exactly: ok" }],
      max_tokens: 16,
      temperature: 0,
    });
    const latencyMs = Date.now() - start;
    // Update health slightly on success
    const models = modelRegistry.list({ provider }).filter((m) => m.modelId === modelId);
    for (const m of models) {
      modelRegistry.updateStatus(m.id, "AVAILABLE", Math.min(100, m.healthScore + 5));
    }
    return {
      provider,
      modelId,
      ok: true,
      latencyMs,
      sampleLength: res.content?.length ?? 0,
      observedAt,
    };
  } catch (err) {
    return {
      provider,
      modelId,
      ok: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
      observedAt,
    };
  }
}
