/**
 * Model discovery — merge provider listModels into registry without inventing availability.
 */

import type { ProviderId } from "@superior-ai/core";
import { getAdapter } from "./providers";
import { getCredentials } from "./credentials";
import { modelRegistry } from "./registry/model-registry";
import { logger } from "@superior-ai/core";

export interface DiscoveryResult {
  provider: ProviderId;
  ok: boolean;
  discovered: string[];
  registeredNew: number;
  message?: string;
}

export async function discoverModels(provider: ProviderId): Promise<DiscoveryResult> {
  const adapter = getAdapter(provider);
  const creds = getCredentials(provider);
  if (!creds.apiKey && provider !== "local") {
    return {
      provider,
      ok: false,
      discovered: [],
      registeredNew: 0,
      message: "CONFIGURATION_REQUIRED — no API key",
    };
  }
  if (provider === "local" && !creds.baseUrl) {
    return {
      provider,
      ok: false,
      discovered: [],
      registeredNew: 0,
      message: "CONFIGURATION_REQUIRED — LOCAL_INFERENCE_URL missing",
    };
  }

  adapter.setCredentials(creds);
  try {
    const discovered = await adapter.listModels();
    let registeredNew = 0;
    for (const modelId of discovered.slice(0, 50)) {
      const existing = modelRegistry.list({ provider }).find((m) => m.modelId === modelId);
      if (!existing) {
        modelRegistry.register({
          provider,
          modelId,
          displayName: modelId,
          status: "AVAILABLE",
          availability: true,
          contextWindow: 128_000,
          maxOutput: 8_192,
          scores: {
            reasoning: 50,
            coding: 50,
            research: 50,
            writing: 50,
            vision: 0,
            audio: 0,
            video: 0,
            mathematics: 50,
            toolUse: 50,
            agentic: 40,
            latency: 50,
            cost: 50,
            reliability: 60,
            freshness: 50,
          },
          multimodalSupport: false,
          functionCalling: true,
          structuredOutput: true,
          webAccess: false,
          codeExecution: false,
          fileAccess: false,
          computerUse: false,
          priority: 40,
          fallbackPriority: 50,
          healthScore: 70,
          aliases: [],
        });
        registeredNew++;
      } else if (existing.status !== "UNAVAILABLE") {
        modelRegistry.updateStatus(existing.id, "AVAILABLE", Math.max(existing.healthScore, 70));
      }
    }
    logger.info("discovery.complete", { provider, count: discovered.length, registeredNew });
    return { provider, ok: true, discovered, registeredNew, message: `Discovered ${discovered.length}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn("discovery.failed", { provider, message });
    return { provider, ok: false, discovered: [], registeredNew: 0, message };
  }
}

export async function discoverAllConfigured(): Promise<DiscoveryResult[]> {
  const providers: ProviderId[] = [
    "openai",
    "anthropic",
    "xai",
    "google",
    "openrouter",
    "local",
    "azure-openai",
  ];
  const out: DiscoveryResult[] = [];
  for (const p of providers) {
    const creds = getCredentials(p);
    if (!creds.apiKey && !(p === "local" && creds.baseUrl)) {
      out.push({
        provider: p,
        ok: false,
        discovered: [],
        registeredNew: 0,
        message: "skipped — not configured",
      });
      continue;
    }
    out.push(await discoverModels(p));
  }
  return out;
}
