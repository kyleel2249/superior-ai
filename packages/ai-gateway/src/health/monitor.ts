/**
 * Provider Health Monitor — OpenRouter is the only live connection,
 * so this tracks a single snapshot rather than looping over five
 * vendor keys that were never actually wired up.
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

let lastHealth: ProviderHealthSnapshot | null = null;

export function getHealthSnapshot(provider?: ProviderId): ProviderHealthSnapshot[] {
  if (!lastHealth) return [];
  if (provider && provider !== "openrouter") return [];
  return [lastHealth];
}

export async function checkProvider(
  provider: ProviderId = "openrouter",
  apiKey?: string,
  baseUrl?: string
): Promise<ProviderHealthSnapshot> {
  const adapter = getAdapter(provider);
  if (apiKey) adapter.setCredentials({ apiKey, baseUrl });
  const result = await adapter.healthCheck();
  const snap: ProviderHealthSnapshot = {
    provider: "openrouter",
    status: result.status,
    healthScore: result.ok ? Math.max(50, 100 - Math.floor((result.latencyMs ?? 0) / 50)) : 0,
    latencyMs: result.latencyMs,
    message: result.message,
    checkedAt: new Date().toISOString(),
  };
  lastHealth = snap;
  if (result.ok) await modelRegistry.refreshFromOpenRouter(adapter);
  else modelRegistry.markProviderDown(result.status, result.message);
  return snap;
}

export async function checkAllFromEnv(): Promise<ProviderHealthSnapshot[]> {
  const key = process.env.OPENROUTER_API_KEY;
  const base = process.env.OPENROUTER_BASE_URL;
  if (!key) {
    const snap: ProviderHealthSnapshot = {
      provider: "openrouter",
      status: "CONFIGURATION_REQUIRED",
      healthScore: 0,
      message: "OPENROUTER_API_KEY not set",
      checkedAt: new Date().toISOString(),
    };
    lastHealth = snap;
    return [snap];
  }
  return [await checkProvider("openrouter", key, base)];
}
