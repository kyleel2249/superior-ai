import { OpenAIAdapter } from "./openai";
import { AnthropicAdapter } from "./anthropic";
import { XAIAdapter } from "./xai";
import { GoogleAdapter } from "./google";
import { LocalAdapter } from "./local";
import { OpenRouterAdapter } from "./openrouter";
import type { BaseProviderAdapter, ProviderCredentials } from "./base";
import type { ProviderId } from "@superior-ai/core";
import { modelRegistry } from "../registry/model-registry";

const adapters: Record<ProviderId, BaseProviderAdapter> = {
  openai: new OpenAIAdapter(),
  anthropic: new AnthropicAdapter(),
  xai: new XAIAdapter(),
  google: new GoogleAdapter(),
  local: new LocalAdapter(),
  openrouter: new OpenRouterAdapter(),
  "azure-openai": new OpenAIAdapter(),
  custom: new OpenAIAdapter(),
};

export function getAdapter(provider: ProviderId): BaseProviderAdapter {
  return adapters[provider];
}

export async function configureAndValidate(
  provider: ProviderId,
  credentials: ProviderCredentials
): Promise<{ ok: boolean; message: string }> {
  const adapter = getAdapter(provider);
  adapter.setCredentials(credentials);
  const result = await adapter.healthCheck();

  const models = modelRegistry.list({ provider });
  for (const m of models) {
    if (m.status === "UNAVAILABLE") continue;
    if (result.ok) {
      modelRegistry.updateStatus(m.id, "AVAILABLE", 90);
    } else {
      modelRegistry.updateStatus(m.id, result.status, 0, result.message);
    }
  }

  return { ok: result.ok, message: result.message ?? (result.ok ? "Validated" : "Failed") };
}

/** Load all providers from environment (including OpenRouter) */
export async function configureFromEnv(): Promise<Array<{ provider: ProviderId; ok: boolean; message: string }>> {
  const entries: Array<{ provider: ProviderId; key?: string; base?: string }> = [
    { provider: "openai", key: process.env.OPENAI_API_KEY, base: process.env.OPENAI_BASE_URL },
    { provider: "anthropic", key: process.env.ANTHROPIC_API_KEY, base: process.env.ANTHROPIC_BASE_URL },
    { provider: "xai", key: process.env.XAI_API_KEY, base: process.env.XAI_BASE_URL },
    { provider: "google", key: process.env.GOOGLE_AI_API_KEY, base: process.env.GOOGLE_AI_BASE_URL },
    {
      provider: "openrouter",
      key: process.env.OPENROUTER_API_KEY,
      base: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
    },
    { provider: "local", key: process.env.LOCAL_INFERENCE_API_KEY, base: process.env.LOCAL_INFERENCE_URL },
  ];
  const out: Array<{ provider: ProviderId; ok: boolean; message: string }> = [];
  for (const e of entries) {
    if (!e.key && e.provider !== "local") {
      out.push({ provider: e.provider, ok: false, message: "API key not set" });
      continue;
    }
    if (e.key) {
      out.push({
        provider: e.provider,
        ...(await configureAndValidate(e.provider, { apiKey: e.key, baseUrl: e.base })),
      });
    }
  }
  return out;
}

export * from "./base";
export { OpenAIAdapter, AnthropicAdapter, XAIAdapter, GoogleAdapter, LocalAdapter, OpenRouterAdapter };
