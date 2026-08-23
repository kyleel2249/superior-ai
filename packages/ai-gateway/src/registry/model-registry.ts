import type { ProviderId, ModelStatus, IntelligenceLevel } from "@superior-ai/core";

export interface RegisteredModel {
  id: string;
  provider: ProviderId;
  modelId: string;
  displayName: string;
  intelligenceLevel: IntelligenceLevel;
  status: ModelStatus;
  healthScore: number;
  availability: boolean;
  lastMessage?: string;
  lastCheckedAt?: string;
}

/**
 * Seed catalog of current models per provider (as of this repo's knowledge
 * cutoff). Availability is UNKNOWN-until-checked: everything starts at
 * CONFIGURATION_REQUIRED and only flips to AVAILABLE once configureAndValidate
 * / checkProvider actually confirms it against a live API key.
 */
const SEED_MODELS: Array<Omit<RegisteredModel, "status" | "healthScore" | "availability">> = [
  { id: "openai:gpt-4o", provider: "openai", modelId: "gpt-4o", displayName: "GPT-4o", intelligenceLevel: "BALANCED" },
  { id: "openai:gpt-4o-mini", provider: "openai", modelId: "gpt-4o-mini", displayName: "GPT-4o mini", intelligenceLevel: "FAST" },
  { id: "openai:o3", provider: "openai", modelId: "o3", displayName: "OpenAI o3", intelligenceLevel: "REASONING" },
  { id: "anthropic:claude-opus-4-8", provider: "anthropic", modelId: "claude-opus-4-8", displayName: "Claude Opus 4.8", intelligenceLevel: "POWERFUL" },
  { id: "anthropic:claude-sonnet-5", provider: "anthropic", modelId: "claude-sonnet-5", displayName: "Claude Sonnet 5", intelligenceLevel: "BALANCED" },
  { id: "anthropic:claude-haiku-4-5", provider: "anthropic", modelId: "claude-haiku-4-5-20251001", displayName: "Claude Haiku 4.5", intelligenceLevel: "FAST" },
  { id: "xai:grok-4", provider: "xai", modelId: "grok-4", displayName: "Grok 4", intelligenceLevel: "POWERFUL" },
  { id: "google:gemini-2.5-pro", provider: "google", modelId: "gemini-2.5-pro", displayName: "Gemini 2.5 Pro", intelligenceLevel: "POWERFUL" },
  { id: "google:gemini-2.5-flash", provider: "google", modelId: "gemini-2.5-flash", displayName: "Gemini 2.5 Flash", intelligenceLevel: "FAST" },
  { id: "openrouter:auto", provider: "openrouter", modelId: "openrouter/auto", displayName: "OpenRouter Auto", intelligenceLevel: "BALANCED" },
  { id: "local:default", provider: "local", modelId: "default", displayName: "Local Model", intelligenceLevel: "FAST" },
];

class ModelRegistry {
  private models: Map<string, RegisteredModel>;

  constructor() {
    this.models = new Map(
      SEED_MODELS.map((m) => [
        m.id,
        { ...m, status: "CONFIGURATION_REQUIRED" as ModelStatus, healthScore: 0, availability: false },
      ])
    );
  }

  list(filter?: { provider?: ProviderId; intelligenceLevel?: IntelligenceLevel }): RegisteredModel[] {
    return Array.from(this.models.values()).filter(
      (m) =>
        (!filter?.provider || m.provider === filter.provider) &&
        (!filter?.intelligenceLevel || m.intelligenceLevel === filter.intelligenceLevel)
    );
  }

  get(id: string): RegisteredModel | undefined {
    return this.models.get(id);
  }

  updateStatus(id: string, status: ModelStatus, healthScore: number, message?: string): void {
    const model = this.models.get(id);
    if (!model) return;
    model.status = status;
    model.healthScore = healthScore;
    model.availability = status === "AVAILABLE";
    model.lastMessage = message;
    model.lastCheckedAt = new Date().toISOString();
  }

  /**
   * Resolves a user-supplied model string ("gpt-4o", "claude-sonnet-5", a
   * registry id like "openai:gpt-4o", etc.) to a registered model. Falls back
   * to a case-insensitive modelId match before giving up.
   */
  resolve(requested: string): { resolved?: RegisteredModel; status: "matched" | "not_found" } {
    const direct = this.models.get(requested);
    if (direct) return { resolved: direct, status: "matched" };
    const byModelId = Array.from(this.models.values()).find(
      (m) => m.modelId.toLowerCase() === requested.toLowerCase()
    );
    if (byModelId) return { resolved: byModelId, status: "matched" };
    return { status: "not_found" };
  }

  bestAvailable(intelligenceLevel: IntelligenceLevel): RegisteredModel | undefined {
    const candidates = this.list({ intelligenceLevel }).filter((m) => m.availability);
    if (candidates.length > 0) return candidates.sort((a, b) => b.healthScore - a.healthScore)[0];
    // No available model at the requested level — fall back to any available model.
    const anyAvailable = Array.from(this.models.values())
      .filter((m) => m.availability)
      .sort((a, b) => b.healthScore - a.healthScore);
    return anyAvailable[0];
  }
}

export const modelRegistry = new ModelRegistry();
