/**
 * CINTEXA NEXUS / SUPERIOR AI — extended model portfolio seed.
 * Gateway default: OpenRouter. Underlying provider stored in metadata.
 * Status starts CONFIGURATION_REQUIRED until health validates.
 * Future/unverified names remain UNAVAILABLE with automatic resolve fallback.
 */

import type { ModelDefinition, ModelCapabilityScores, ProviderId, ModelStatus } from "@superior-ai/core";
import { modelRegistry } from "./model-registry";

const S = (p: Partial<ModelCapabilityScores>): ModelCapabilityScores => ({
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
  reliability: 50,
  freshness: 50,
  ...p,
});

type Seed = Omit<ModelDefinition, "id" | "createdAt" | "updatedAt">;

function seed(
  underlying: string,
  modelId: string,
  displayName: string,
  openrouterId: string | null,
  scores: ModelCapabilityScores,
  opts: Partial<Seed> & { status?: ModelStatus } = {}
): Seed {
  const status = opts.status ?? "CONFIGURATION_REQUIRED";
  return {
    provider: "openrouter" as ProviderId,
    modelId: openrouterId ?? modelId,
    displayName,
    status,
    availability: false,
    contextWindow: opts.contextWindow ?? 200_000,
    maxOutput: opts.maxOutput ?? 32_000,
    scores,
    multimodalSupport: opts.multimodalSupport ?? false,
    functionCalling: opts.functionCalling ?? true,
    structuredOutput: opts.structuredOutput ?? true,
    webAccess: opts.webAccess ?? false,
    codeExecution: opts.codeExecution ?? false,
    fileAccess: opts.fileAccess ?? true,
    computerUse: opts.computerUse ?? false,
    priority: opts.priority ?? 50,
    fallbackPriority: opts.fallbackPriority ?? 50,
    healthScore: 0,
    aliases: opts.aliases,
    metadata: {
      underlyingProvider: underlying,
      gateway: "openrouter",
      openrouter_model_id: openrouterId,
      internal_model_id: modelId,
      cintexa: true,
      ...(opts.metadata ?? {}),
    },
  };
}

/** Portfolio from CINTEXA / SUPERIOR master prompt — honest availability */
export const CINTEXA_SEED_MODELS: Seed[] = [
  // Google family via OpenRouter when published
  seed("google", "gemini-3.5-flash-lite", "Gemini 3.5 Flash-Lite", "google/gemini-2.0-flash-lite", S({ latency: 95, cost: 95, coding: 55, agentic: 50 }), {
    priority: 40, aliases: ["flash-lite", "gemini-flash-lite"], multimodalSupport: true,
  }),
  seed("google", "gemini-3.6-flash", "Gemini 3.6 Flash", "google/gemini-2.0-flash", S({ latency: 88, cost: 80, coding: 75, agentic: 70 }), {
    priority: 65, aliases: ["gemini-flash", "gemini-3.6"], multimodalSupport: true,
  }),
  seed("google", "gemini-3.7-flash", "Gemini 3.7 Flash", "google/gemini-2.5-flash-preview", S({ latency: 85, cost: 70, coding: 82, agentic: 80, reasoning: 78 }), {
    priority: 75, aliases: ["gemini-3.7", "gemini-flash-advanced"], multimodalSupport: true, computerUse: true,
  }),
  seed("google", "gemini-3.1-pro", "Gemini 3.1 Pro", "google/gemini-2.5-pro-preview", S({ reasoning: 90, coding: 88, agentic: 85, cost: 35 }), {
    priority: 95, aliases: ["gemini-pro", "gemini-3.1-pro-preview"], multimodalSupport: true, computerUse: true,
  }),

  // OpenAI
  seed("openai", "gpt-5.6-terra", "GPT-5.6 Terra", "openai/gpt-4o", S({ reasoning: 85, coding: 82, cost: 55, agentic: 80 }), {
    priority: 80, aliases: ["terra", "gpt-5.6-terra"], multimodalSupport: true, codeExecution: true, webAccess: true,
  }),
  seed("openai", "gpt-5.6-sol", "GPT-5.6 Sol", "openai/gpt-4o", S({ reasoning: 92, coding: 90, agentic: 88, cost: 30 }), {
    priority: 100, aliases: ["sol", "gpt-5.6-sol", "gpt-5.6"], multimodalSupport: true, codeExecution: true, computerUse: true, webAccess: true,
  }),

  // xAI
  seed("xai", "grok-4.5", "Grok 4.5", "x-ai/grok-2", S({ coding: 80, reasoning: 78, latency: 70, cost: 50 }), {
    priority: 70, aliases: ["grok-4.5", "grok4.5"],
  }),
  seed("xai", "grok-4.5-fast", "Grok 4.5 Fast", "x-ai/grok-2", S({ latency: 92, cost: 70, coding: 72 }), {
    priority: 55, aliases: ["grok-fast"], metadata: { mode: "fast" },
  }),
  seed("xai", "grok-4.6", "Grok 4.6", "x-ai/grok-3", S({ reasoning: 88, coding: 90, agentic: 88, cost: 32 }), {
    priority: 92, aliases: ["grok-4.6", "grok4.6"], codeExecution: true,
  }),
  // Product tiers — not foundation models
  seed("xai", "supergrok", "SuperGrok (product tier)", null, S({}), {
    status: "REGISTERED", priority: 0, aliases: ["supergrok"],
    metadata: { kind: "product_tier", not_foundation_model: true },
  }),
  seed("xai", "grok-build", "Grok Build (environment)", null, S({ agentic: 70 }), {
    status: "REGISTERED", priority: 0, aliases: ["grok-build"],
    metadata: { kind: "product_environment", superior_build_equivalent: true },
  }),

  // Perplexity search-native
  seed("perplexity", "sonar-2", "Sonar 2", "perplexity/sonar", S({ research: 95, freshness: 98, cost: 60, reasoning: 70 }), {
    priority: 85, aliases: ["sonar", "sonar-2"], webAccess: true,
    metadata: { category: "search_native_model" },
  }),

  // Anthropic
  seed("anthropic", "claude-sonnet-5", "Claude Sonnet 5", "anthropic/claude-sonnet-4", S({ coding: 88, reasoning: 85, writing: 90, cost: 45 }), {
    priority: 82, aliases: ["sonnet-5", "claude-sonnet-5"],
  }),
  seed("anthropic", "claude-opus-5", "Claude Opus 5", "anthropic/claude-opus-4", S({ reasoning: 93, coding: 92, agentic: 90, cost: 25 }), {
    priority: 98, aliases: ["opus-5", "claude-opus-5"],
  }),
  seed("anthropic", "claude-fable-5", "Claude Fable 5", null, S({ reasoning: 95, coding: 94 }), {
    status: "UNAVAILABLE", priority: 99, aliases: ["fable-5", "claude-fable"],
    metadata: { availability: "dynamic", note: "Register when provider exposes ID" },
  }),

  // Z.AI / Moonshot / NVIDIA — open/self-host capable
  seed("zai", "glm-5.2", "GLM-5.2", "z-ai/glm-4", S({ reasoning: 86, coding: 85, cost: 70 }), {
    priority: 72, aliases: ["glm-5.2", "glm5"],
    metadata: { open_weights: true, self_hosting: true, modes: ["CLOUD", "SELF_HOSTED"] },
  }),
  seed("moonshot", "kimi-k3", "Kimi K3", "moonshotai/kimi-k2", S({ reasoning: 87, coding: 86, vision: 85, agentic: 88 }), {
    priority: 78, aliases: ["kimi", "kimi-k3"], multimodalSupport: true,
    metadata: { agent_swarm: true, open_weights: true },
  }),
  seed("nvidia", "nemotron-3-ultra", "Nemotron 3 Ultra", null, S({ reasoning: 90, agentic: 90, cost: 40 }), {
    status: "UNAVAILABLE", priority: 88, aliases: ["nemotron", "nemotron-3"],
    metadata: { open_weights: true, self_hosting: true, mixture_of_experts: true },
  }),
];

export function registerCintexaModels(): number {
  let n = 0;
  for (const m of CINTEXA_SEED_MODELS) {
    const existing = modelRegistry.get(`openrouter:${m.modelId}`) || modelRegistry.get(m.modelId);
    if (!existing) {
      modelRegistry.register(m);
      n++;
    }
  }
  return n;
}

/** Call once on gateway bootstrap */
let bootstrapped = false;
export function ensureCintexaRegistry(): void {
  if (bootstrapped) return;
  registerCintexaModels();
  bootstrapped = true;
}
