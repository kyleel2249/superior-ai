import { OpenRouterAdapter } from "./openrouter";
import type { BaseProviderAdapter, ProviderCredentials } from "./base";
import type { ProviderId } from "@superior-ai/core";
import { modelRegistry } from "../registry/model-registry";

/**
 * SUPERIOR AI is wired to a single live connection: OpenRouter.
 * OpenRouter itself proxies OpenAI, Anthropic, Google, xAI, Meta,
 * DeepSeek, Mistral, and local/self-hosted endpoints behind one
 * OpenAI-compatible API, so a single adapter instance is genuinely
 * sufficient — there is no need for (and no working code path for)
 * separate direct vendor adapters.
 *
 * `getAdapter()` still accepts any ProviderId because the model
 * registry tags each discovered model with its vendor family for
 * display/filtering purposes (see registry/model-registry.ts) — but
 * every one of those tags resolves to this same OpenRouter instance.
 *
 * Adding a *direct* (non-OpenRouter) vendor adapter later just means
 * implementing BaseProviderAdapter in a new file and registering it
 * below — the router and registry don't need to change.
 */
const openRouter = new OpenRouterAdapter();

export function getAdapter(_provider: ProviderId): BaseProviderAdapter {
  return openRouter;
}

export async function configureAndValidate(
  provider: ProviderId,
  credentials: ProviderCredentials
): Promise<{ ok: boolean; message: string }> {
  if (provider !== "openrouter") {
    return {
      ok: false,
      message: `Provider "${provider}" has no direct adapter. SUPERIOR AI routes all models through OpenRouter — configure "openrouter" instead.`,
    };
  }
  const adapter = getAdapter(provider);
  adapter.setCredentials(credentials);
  const result = await adapter.healthCheck();
  if (result.ok) {
    await modelRegistry.refreshFromOpenRouter(adapter);
  } else {
    modelRegistry.markProviderDown(result.status, result.message);
  }
  return { ok: result.ok, message: result.message ?? (result.ok ? "Validated" : "Failed") };
}

export async function configureFromEnv(): Promise<
  Array<{ provider: ProviderId; ok: boolean; message: string }>
> {
  const key = process.env.OPENROUTER_API_KEY;
  const base = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
  if (!key) {
    return [{ provider: "openrouter", ok: false, message: "OPENROUTER_API_KEY not set" }];
  }
  const result = await configureAndValidate("openrouter", { apiKey: key, baseUrl: base });
  return [{ provider: "openrouter", ...result }];
}

export * from "./base";
export { OpenRouterAdapter };
