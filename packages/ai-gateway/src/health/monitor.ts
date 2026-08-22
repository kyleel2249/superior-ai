/**
 * Provider Health Monitor
 */
import type { ProviderId, ModelStatus } from "@superior-ai/core";
import { getAdapter } from "../providers";
import { modelRegistry } from "../registry/model-registry";

export interface ProviderHealthSnapshot {
  provider: ProviderId;
  status: ModelStatus;
  healthScore: number;
  latencyMs?: number;
  message?: string;
  checkedAt: string;
}

const lastHealth = new Map<ProviderId, ProviderHealthSnapshot>();

export function getHealthSnapshot(provider?: ProviderId): ProviderHealthSnapshot[] {
  if (provider) {
    const h = lastHealth.get(provider);
    return h ? [h] : [];
  }
  return Array.from(lastHealth.values());
}

export async function checkProvider(provider: ProviderId, apiKey?: string, baseUrl?: string): Promise<ProviderHealthSnapshot> {
  const adapter = getAdapter(provider);
  if (apiKey) adapter.setCredentials({ apiKey, baseUrl });
  const result = await adapter.healthCheck();
  const snap: ProviderHealthSnapshot = {
    provider,
    status: result.status,
    healthScore: result.ok ? Math.max(50, 100 - Math.floor((result.latencyMs ?? 0) / 50)) : 0,
    latencyMs: result.latencyMs,
    message: result.message,
    checkedAt: new Date().toISOString(),
  };
  lastHealth.set(provider, snap);
  for (const m of modelRegistry.list({ provider })) {
    if (m.status === "UNAVAILABLE") continue;
    modelRegistry.updateStatus(m.id, result.ok ? "AVAILABLE" : result.status, snap.healthScore, result.message);
  }
  return snap;
}

export async function checkAllFromEnv(): Promise<ProviderHealthSnapshot[]> {
  const configs: Array<{ provider: ProviderId; key?: string; base?: string }> = [
    { provider: "openai", key: process.env.OPENAI_API_KEY, base: process.env.OPENAI_BASE_URL },
    { provider: "anthropic", key: process.env.ANTHROPIC_API_KEY, base: process.env.ANTHROPIC_BASE_URL },
    { provider: "xai", key: process.env.XAI_API_KEY, base: process.env.XAI_BASE_URL },
    { provider: "google", key: process.env.GOOGLE_AI_API_KEY, base: process.env.GOOGLE_AI_BASE_URL },
    { provider: "local", key: process.env.LOCAL_INFERENCE_API_KEY, base: process.env.LOCAL_INFERENCE_URL },
  ];
  const out: ProviderHealthSnapshot[] = [];
  for (const c of configs) {
    if (!c.key && c.provider !== "local") {
      out.push({ provider: c.provider, status: "CONFIGURATION_REQUIRED", healthScore: 0, message: "API key not set", checkedAt: new Date().toISOString() });
      continue;
    }
    out.push(await checkProvider(c.provider, c.key, c.base));
  }
  return out;
}
