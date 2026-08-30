/**
 * Dynamic Model Registry
 * Editable from admin console without rebuild.
 * Models only become AVAILABLE after successful validation.
 *
 * IMPORTANT: this file used to contain a second, independent seed list
 * for the same stylized model names (GPT-5.6 Sol, Claude Opus 5, Grok 4.6,
 * etc.) that cintexa-models.ts also seeds. That caused genuine duplicate
 * registry entries — this file's version used the fictional display-name
 * string as a literal, raw provider model ID (e.g. provider: "anthropic",
 * modelId: "claude-opus-5"), which isn't a real Anthropic model ID; if a
 * real Anthropic key were ever configured (not via OpenRouter), that
 * entry would fail with "model not found" rather than the honest
 * CONFIGURATION_REQUIRED an unconfigured model should show. Worse,
 * per-role selection (planCouncil) could inconsistently pick either the
 * correct cintexa-models.ts entry or this broken duplicate depending on
 * registration order and sort ties.
 *
 * Fix: the 9 models that overlapped with cintexa-models.ts's correctly
 * OpenRouter-routed entries were removed from here entirely — that file
 * (via ensureCintexaRegistry()) is now the sole source for those. The two
 * remaining stylized-name entries that were unique to this file (GPT-5.6
 * Luna, GPT-5.3 Codex) are kept but fixed to route through OpenRouter
 * with an honest null mapping (openrouter_model_id: null) rather than a
 * raw, unverifiable provider ID — same honest pattern cintexa-models.ts
 * already uses for Claude Fable 5 and SuperGrok. GPT-6/GPT-7 (Future) are
 * untouched — already safely inert (UNAVAILABLE, priority 0). The 4
 * OpenRouter-native entries and the Local entry are untouched — they
 * already used real, correct IDs.
 */

import type {
  ModelDefinition,
  ModelStatus,
  ProviderId,
  ModelCapabilityScores,
} from "@superior-ai/core";

const DEFAULT_SCORES: ModelCapabilityScores = {
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
};

/** Seed registry with known families. Status starts as CONFIGURATION_REQUIRED. */
const SEED_MODELS: Omit<ModelDefinition, "id" | "createdAt" | "updatedAt">[] = [
  // OpenAI — stylized/unverified names, honestly routed through OpenRouter
  // with no real mapping (openrouter_model_id: null) rather than guessed.
  // The real, verified GPT-5.6 Sol/Terra entries live in cintexa-models.ts.
  {
    provider: "openrouter",
    modelId: "gpt-5.6-luna",
    displayName: "GPT-5.6 Luna",
    status: "CONFIGURATION_REQUIRED",
    availability: false,
    contextWindow: 1_050_000,
    maxOutput: 64_000,
    scores: { ...DEFAULT_SCORES, reasoning: 75, coding: 72, latency: 85, cost: 80 },
    multimodalSupport: true,
    functionCalling: true,
    structuredOutput: true,
    webAccess: false,
    codeExecution: false,
    fileAccess: true,
    computerUse: false,
    priority: 60,
    fallbackPriority: 30,
    healthScore: 0,
    aliases: ["luna"],
    metadata: { underlyingProvider: "openai", gateway: "openrouter", openrouter_model_id: null, internal_model_id: "gpt-5.6-luna" },
  },
  {
    provider: "openrouter",
    modelId: "gpt-5.3-codex",
    displayName: "GPT-5.3 Codex",
    status: "CONFIGURATION_REQUIRED",
    availability: false,
    contextWindow: 400_000,
    maxOutput: 128_000,
    scores: { ...DEFAULT_SCORES, coding: 95, agentic: 90, reasoning: 80 },
    multimodalSupport: true,
    functionCalling: true,
    structuredOutput: true,
    webAccess: false,
    codeExecution: true,
    fileAccess: true,
    computerUse: true,
    priority: 95,
    fallbackPriority: 15,
    healthScore: 0,
    aliases: ["codex", "gpt-5.3-codex"],
    metadata: { underlyingProvider: "openai", gateway: "openrouter", openrouter_model_id: null, internal_model_id: "gpt-5.3-codex" },
  },
  // Future / alias entries — UNAVAILABLE until real API exposure
  {
    provider: "openai",
    modelId: "gpt-6",
    displayName: "GPT-6 (Future)",
    status: "UNAVAILABLE",
    availability: false,
    contextWindow: 0,
    maxOutput: 0,
    scores: DEFAULT_SCORES,
    multimodalSupport: false,
    functionCalling: false,
    structuredOutput: false,
    webAccess: false,
    codeExecution: false,
    fileAccess: false,
    computerUse: false,
    priority: 0,
    fallbackPriority: 0,
    healthScore: 0,
    aliases: ["GPT-6", "gpt-6"],
  },
  {
    provider: "openai",
    modelId: "gpt-7",
    displayName: "GPT-7 (Future)",
    status: "UNAVAILABLE",
    availability: false,
    contextWindow: 0,
    maxOutput: 0,
    scores: DEFAULT_SCORES,
    multimodalSupport: false,
    functionCalling: false,
    structuredOutput: false,
    webAccess: false,
    codeExecution: false,
    fileAccess: false,
    computerUse: false,
    priority: 0,
    fallbackPriority: 0,
    healthScore: 0,
    aliases: ["GPT-7", "gpt-7"],
  },

  // OpenRouter — routes to many upstream models via one key
  // NOTE: gpt-4o-mini's broader GPT-4o family is being retired across
  // multiple platforms through 2026 (Azure Foundry retirement confirmed
  // March 31 2026; OpenAI's own retirement signals are less uniformly
  // confirmed as of this check). Left unchanged rather than guess a
  // replacement without the same live-verification confidence used for
  // the two entries above (claude-sonnet-4.6, gemini-3.6-flash) — worth
  // re-checking specifically before relying on this one.
  {
    provider: "openrouter",
    modelId: "openai/gpt-4o-mini",
    displayName: "OpenRouter · GPT-4o Mini",
    status: "CONFIGURATION_REQUIRED",
    availability: false,
    contextWindow: 128_000,
    maxOutput: 16_000,
    scores: { ...DEFAULT_SCORES, reasoning: 78, coding: 80, cost: 85, latency: 75 },
    multimodalSupport: true,
    functionCalling: true,
    structuredOutput: true,
    webAccess: false,
    codeExecution: false,
    fileAccess: false,
    computerUse: false,
    priority: 70,
    fallbackPriority: 60,
    healthScore: 0,
    aliases: ["or-gpt-4o-mini", "openrouter-mini"],
  },
  {
    provider: "openrouter",
    modelId: "anthropic/claude-sonnet-4.6",
    displayName: "OpenRouter · Claude Sonnet",
    status: "CONFIGURATION_REQUIRED",
    availability: false,
    contextWindow: 200_000,
    maxOutput: 64_000,
    scores: { ...DEFAULT_SCORES, reasoning: 90, coding: 88, writing: 92, cost: 45 },
    multimodalSupport: true,
    functionCalling: true,
    structuredOutput: true,
    webAccess: false,
    codeExecution: false,
    fileAccess: true,
    computerUse: false,
    priority: 85,
    fallbackPriority: 50,
    healthScore: 0,
    aliases: ["or-claude-sonnet", "openrouter-sonnet"],
  },
  {
    provider: "openrouter",
    modelId: "google/gemini-3.6-flash",
    displayName: "OpenRouter · Gemini Flash",
    status: "CONFIGURATION_REQUIRED",
    availability: false,
    contextWindow: 1_000_000,
    maxOutput: 64_000,
    scores: { ...DEFAULT_SCORES, reasoning: 82, coding: 80, latency: 85, cost: 80 },
    multimodalSupport: true,
    functionCalling: true,
    structuredOutput: true,
    webAccess: false,
    codeExecution: false,
    fileAccess: false,
    computerUse: false,
    priority: 75,
    fallbackPriority: 55,
    healthScore: 0,
    aliases: ["or-gemini-flash", "openrouter-gemini"],
  },
  {
    provider: "openrouter",
    modelId: "openrouter/auto",
    displayName: "OpenRouter · Auto",
    status: "CONFIGURATION_REQUIRED",
    availability: false,
    contextWindow: 128_000,
    maxOutput: 16_000,
    scores: { ...DEFAULT_SCORES, cost: 70, reliability: 70 },
    multimodalSupport: true,
    functionCalling: true,
    structuredOutput: true,
    webAccess: false,
    codeExecution: false,
    fileAccess: false,
    computerUse: false,
    priority: 65,
    fallbackPriority: 70,
    healthScore: 0,
    aliases: ["openrouter-auto", "or-auto"],
  },
  // Local fallback
  {
    provider: "local",
    modelId: "local-default",
    displayName: "Local OpenAI-compatible",
    status: "CONFIGURATION_REQUIRED",
    availability: false,
    contextWindow: 128_000,
    maxOutput: 32_000,
    scores: { ...DEFAULT_SCORES, cost: 100, latency: 60, reliability: 40 },
    multimodalSupport: false,
    functionCalling: true,
    structuredOutput: true,
    webAccess: false,
    codeExecution: false,
    fileAccess: false,
    computerUse: false,
    priority: 10,
    fallbackPriority: 100,
    healthScore: 0,
    aliases: ["local", "ollama", "vllm"],
  },
];

export class ModelRegistry {
  private models = new Map<string, ModelDefinition>();
  private aliasIndex = new Map<string, string>(); // alias → modelId key

  constructor() {
    const now = new Date().toISOString();
    for (const seed of SEED_MODELS) {
      const id = `${seed.provider}:${seed.modelId}`;
      const def: ModelDefinition = {
        ...seed,
        id,
        createdAt: now,
        updatedAt: now,
      };
      this.models.set(id, def);
      this.indexAliases(def);
    }
  }

  private indexAliases(def: ModelDefinition) {
    this.aliasIndex.set(def.modelId.toLowerCase(), def.id);
    this.aliasIndex.set(def.displayName.toLowerCase(), def.id);
    for (const a of def.aliases ?? []) {
      this.aliasIndex.set(a.toLowerCase(), def.id);
    }
  }

  list(filter?: { provider?: ProviderId; status?: ModelStatus; availableOnly?: boolean }): ModelDefinition[] {
    let result = Array.from(this.models.values());
    if (filter?.provider) result = result.filter((m) => m.provider === filter.provider);
    if (filter?.status) result = result.filter((m) => m.status === filter.status);
    if (filter?.availableOnly) result = result.filter((m) => m.availability && m.status === "AVAILABLE");
    return result.sort((a, b) => b.priority - a.priority);
  }

  get(idOrAlias: string): ModelDefinition | undefined {
    const key = this.aliasIndex.get(idOrAlias.toLowerCase()) ?? idOrAlias;
    return this.models.get(key);
  }

  /** Resolve requested name → best available or explicit UNAVAILABLE */
  resolve(requested: string): { requested: string; resolved: ModelDefinition | null; status: string } {
    const found = this.get(requested);
    if (!found) {
      return { requested, resolved: null, status: "NOT_REGISTERED" };
    }
    if (found.status === "AVAILABLE" && found.availability) {
      return { requested, resolved: found, status: "AVAILABLE" };
    }
    // Future / unavailable alias → find best fallback of same provider or overall
    const available = this.list({ availableOnly: true });
    const sameProvider = available.filter((m) => m.provider === found.provider);
    const fallback = sameProvider[0] ?? available[0] ?? null;
    return {
      requested,
      resolved: fallback,
      status: found.status === "UNAVAILABLE" ? "FUTURE_UNAVAILABLE" : found.status,
    };
  }

  register(def: Omit<ModelDefinition, "id" | "createdAt" | "updatedAt">): ModelDefinition {
    const id = `${def.provider}:${def.modelId}`;
    const now = new Date().toISOString();
    const full: ModelDefinition = { ...def, id, createdAt: now, updatedAt: now };
    this.models.set(id, full);
    this.indexAliases(full);
    return full;
  }

  updateStatus(id: string, status: ModelStatus, healthScore?: number, error?: string): void {
    const m = this.models.get(id);
    if (!m) return;
    m.status = status;
    m.availability = status === "AVAILABLE";
    if (healthScore !== undefined) m.healthScore = healthScore;
    m.updatedAt = new Date().toISOString();
    m.lastValidatedAt = m.updatedAt;
    if (error) m.metadata = { ...m.metadata, lastError: error };
  }

  /** Admin-editable without rebuild */
  setScores(id: string, scores: Partial<ModelCapabilityScores>): void {
    const m = this.models.get(id);
    if (!m) return;
    m.scores = { ...m.scores, ...scores };
    m.updatedAt = new Date().toISOString();
  }
}

export const modelRegistry = new ModelRegistry();
