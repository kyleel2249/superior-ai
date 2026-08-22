/**
 * Dynamic Model Registry
 * Editable from admin console without rebuild.
 * Models only become AVAILABLE after successful validation.
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
  // OpenAI — GPT-5.6 family (as of mid-2026 public info)
  {
    provider: "openai",
    modelId: "gpt-5.6-sol",
    displayName: "GPT-5.6 Sol",
    status: "CONFIGURATION_REQUIRED",
    availability: false,
    contextWindow: 1_050_000,
    maxOutput: 128_000,
    scores: { ...DEFAULT_SCORES, reasoning: 92, coding: 90, agentic: 88, cost: 30 },
    multimodalSupport: true,
    functionCalling: true,
    structuredOutput: true,
    webAccess: true,
    codeExecution: true,
    fileAccess: true,
    computerUse: true,
    priority: 100,
    fallbackPriority: 10,
    healthScore: 0,
    aliases: ["gpt-5.6", "GPT-5.6", "sol"],
  },
  {
    provider: "openai",
    modelId: "gpt-5.6-terra",
    displayName: "GPT-5.6 Terra",
    status: "CONFIGURATION_REQUIRED",
    availability: false,
    contextWindow: 1_050_000,
    maxOutput: 128_000,
    scores: { ...DEFAULT_SCORES, reasoning: 85, coding: 82, cost: 55 },
    multimodalSupport: true,
    functionCalling: true,
    structuredOutput: true,
    webAccess: true,
    codeExecution: true,
    fileAccess: true,
    computerUse: false,
    priority: 80,
    fallbackPriority: 20,
    healthScore: 0,
    aliases: ["terra"],
  },
  {
    provider: "openai",
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
  },
  {
    provider: "openai",
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
  // Anthropic
  {
    provider: "anthropic",
    modelId: "claude-opus-5",
    displayName: "Claude Opus 5",
    status: "CONFIGURATION_REQUIRED",
    availability: false,
    contextWindow: 1_000_000,
    maxOutput: 128_000,
    scores: { ...DEFAULT_SCORES, reasoning: 94, coding: 88, writing: 92, agentic: 90 },
    multimodalSupport: true,
    functionCalling: true,
    structuredOutput: true,
    webAccess: false,
    codeExecution: false,
    fileAccess: true,
    computerUse: true,
    priority: 98,
    fallbackPriority: 12,
    healthScore: 0,
    aliases: ["opus-5", "Opus 5", "claude-opus"],
  },
  {
    provider: "anthropic",
    modelId: "claude-sonnet-5",
    displayName: "Claude Sonnet 5",
    status: "CONFIGURATION_REQUIRED",
    availability: false,
    contextWindow: 1_000_000,
    maxOutput: 64_000,
    scores: { ...DEFAULT_SCORES, reasoning: 86, coding: 84, cost: 60, latency: 70 },
    multimodalSupport: true,
    functionCalling: true,
    structuredOutput: true,
    webAccess: false,
    codeExecution: false,
    fileAccess: true,
    computerUse: false,
    priority: 75,
    fallbackPriority: 25,
    healthScore: 0,
    aliases: ["sonnet-5", "Sonnet 5"],
  },
  {
    provider: "anthropic",
    modelId: "claude-fable-5",
    displayName: "Claude Fable 5",
    status: "CONFIGURATION_REQUIRED",
    availability: false,
    contextWindow: 1_000_000,
    maxOutput: 128_000,
    scores: { ...DEFAULT_SCORES, reasoning: 93, coding: 87, writing: 94 },
    multimodalSupport: true,
    functionCalling: true,
    structuredOutput: true,
    webAccess: false,
    codeExecution: false,
    fileAccess: true,
    computerUse: true,
    priority: 97,
    fallbackPriority: 11,
    healthScore: 0,
    aliases: ["fable-5", "Fable 5"],
  },
  // xAI Grok
  {
    provider: "xai",
    modelId: "grok-4.6",
    displayName: "Grok 4.6",
    status: "CONFIGURATION_REQUIRED",
    availability: false,
    contextWindow: 500_000,
    maxOutput: 128_000,
    scores: { ...DEFAULT_SCORES, reasoning: 88, coding: 86, research: 85, latency: 75 },
    multimodalSupport: true,
    functionCalling: true,
    structuredOutput: true,
    webAccess: true,
    codeExecution: false,
    fileAccess: false,
    computerUse: false,
    priority: 90,
    fallbackPriority: 18,
    healthScore: 0,
    aliases: ["grok-4.6", "Grok 4.6"],
  },
  {
    provider: "xai",
    modelId: "grok-4.5",
    displayName: "Grok 4.5",
    status: "CONFIGURATION_REQUIRED",
    availability: false,
    contextWindow: 500_000,
    maxOutput: 128_000,
    scores: { ...DEFAULT_SCORES, reasoning: 84, coding: 82 },
    multimodalSupport: true,
    functionCalling: true,
    structuredOutput: true,
    webAccess: true,
    codeExecution: false,
    fileAccess: false,
    computerUse: false,
    priority: 70,
    fallbackPriority: 28,
    healthScore: 0,
    aliases: ["grok-4.5", "Grok 4.5"],
  },
  // Google Gemini
  {
    provider: "google",
    modelId: "gemini-3.1-pro",
    displayName: "Gemini 3.1 Pro",
    status: "CONFIGURATION_REQUIRED",
    availability: false,
    contextWindow: 1_000_000,
    maxOutput: 64_000,
    scores: { ...DEFAULT_SCORES, reasoning: 87, coding: 80, vision: 90, research: 88 },
    multimodalSupport: true,
    functionCalling: true,
    structuredOutput: true,
    webAccess: true,
    codeExecution: true,
    fileAccess: true,
    computerUse: false,
    priority: 88,
    fallbackPriority: 22,
    healthScore: 0,
    aliases: ["gemini-3.1-pro", "Gemini 3.1 Pro"],
  },
  {
    provider: "google",
    modelId: "gemini-3.6-flash",
    displayName: "Gemini 3.6 Flash",
    status: "CONFIGURATION_REQUIRED",
    availability: false,
    contextWindow: 1_000_000,
    maxOutput: 32_000,
    scores: { ...DEFAULT_SCORES, latency: 95, cost: 90, reasoning: 78 },
    multimodalSupport: true,
    functionCalling: true,
    structuredOutput: true,
    webAccess: true,
    codeExecution: true,
    fileAccess: true,
    computerUse: false,
    priority: 55,
    fallbackPriority: 40,
    healthScore: 0,
    aliases: ["gemini-3.6-flash", "Gemini 3.6 Flash"],
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
