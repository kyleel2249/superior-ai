import { OpenAIAdapter } from "./openai";
import { AnthropicAdapter } from "./anthropic";
import { XAIAdapter } from "./xai";
import { GoogleAdapter } from "./google";
import { LocalAdapter } from "./local";
import type { BaseProviderAdapter, ProviderCredentials } from "./base";
import type { ProviderId } from "@superior-ai/core";
import { modelRegistry } from "../registry/model-registry";

const adapters: Record<ProviderId, BaseProviderAdapter> = {
  openai: new OpenAIAdapter(),
  anthropic: new AnthropicAdapter(),
  xai: new XAIAdapter(),
  google: new GoogleAdapter(),
  local: new LocalAdapter(),
  openrouter: new OpenAIAdapter(), // reuse OpenAI-compatible
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

  // Update registry models for this provider
  const models = modelRegistry.list({ provider });
  for (const m of models) {
    if (m.status === "UNAVAILABLE") continue; // keep future aliases
    if (result.ok) {
      modelRegistry.updateStatus(m.id, "AVAILABLE", 90);
    } else {
      modelRegistry.updateStatus(m.id, result.status, 0, result.message);
    }
  }

  return { ok: result.ok, message: result.message ?? (result.ok ? "Validated" : "Failed") };
}

export * from "./base";
export { OpenAIAdapter, AnthropicAdapter, XAIAdapter, GoogleAdapter, LocalAdapter };
