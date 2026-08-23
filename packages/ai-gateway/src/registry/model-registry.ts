import type { ProviderId, ModelStatus, IntelligenceLevel } from "@superior-ai/core";
import type { BaseProviderAdapter } from "../providers/base";

export interface RegisteredModel {
  /** Stable id used for lookups, e.g. "openai/gpt-4o" */
  id: string;
  /** Vendor family tag, guessed from the slug prefix. Purely descriptive. */
  provider: ProviderId;
  /** Exact slug to send to OpenRouter's `model` field. */
  modelId: string;
  displayName: string;
  status: ModelStatus;
  healthScore: number;
  intelligenceLevel: IntelligenceLevel;
  message?: string;
  discoveredAt?: string;
  availability: boolean;
}

const FAMILY_PREFIX: Array<{ prefix: string; provider: ProviderId }> = [
  { prefix: "openai/", provider: "openai" },
  { prefix: "anthropic/", provider: "anthropic" },
  { prefix: "google/", provider: "google" },
  { prefix: "x-ai/", provider: "xai" },
  { prefix: "meta-llama/", provider: "meta" },
  { prefix: "mistralai/", provider: "mistral" },
  { prefix: "deepseek/", provider: "deepseek" },
];

function guessProvider(slug: string): ProviderId {
  return FAMILY_PREFIX.find((f) => slug.startsWith(f.prefix))?.provider ?? "openrouter";
}

/** Cheap heuristic — real cost/latency data comes from OpenRouter's /models payload; this just buckets by name until that's wired through. */
function guessIntelligence(slug: string): IntelligenceLevel {
  const s = slug.toLowerCase();
  if (/(mini|small|flash|haiku|nano|8b|7b|lite)/.test(s)) return "FAST";
  if (/(opus|pro|large|ultra|405b|frontier|o1|o3)/.test(s)) return "FRONTIER";
  return "BALANCED";
}

class ModelRegistry {
  private models = new Map<string, RegisteredModel>();

  list(filter?: { provider?: ProviderId; status?: ModelStatus }): RegisteredModel[] {
    let out = Array.from(this.models.values());
    if (filter?.provider) out = out.filter((m) => m.provider === filter.provider);
    if (filter?.status) out = out.filter((m) => m.status === filter.status);
    return out;
  }

  resolve(requested: string): { resolved?: RegisteredModel; status: ModelStatus } {
    const direct = this.models.get(requested);
    if (direct) return { resolved: direct, status: direct.status };
    // allow lookups by bare modelId too
    const byModelId = Array.from(this.models.values()).find((m) => m.modelId === requested);
    if (byModelId) return { resolved: byModelId, status: byModelId.status };
    return { resolved: undefined, status: "UNAVAILABLE" };
  }

  updateStatus(id: string, status: ModelStatus, healthScore: number, message?: string): void {
    const m = this.models.get(id);
    if (!m) return;
    m.status = status;
    m.healthScore = healthScore;
    m.availability = status === "AVAILABLE";
    m.message = message;
  }

  /** No live validation has succeeded (yet) — mark everything honestly unavailable rather than pretending. */
  markProviderDown(status: ModelStatus, message?: string): void {
    for (const m of this.models.values()) {
      m.status = status;
      m.healthScore = 0;
      m.availability = false;
      m.message = message;
    }
  }

  /** Populate the registry from OpenRouter's live /models endpoint. Nothing is invented here — only slugs OpenRouter actually returned. */
  async refreshFromOpenRouter(adapter: BaseProviderAdapter): Promise<{ discovered: number }> {
    const slugs = await adapter.listModels();
    const now = new Date().toISOString();
    for (const slug of slugs) {
      this.models.set(slug, {
        id: slug,
        provider: guessProvider(slug),
        modelId: slug,
        displayName: slug,
        status: "AVAILABLE",
        healthScore: 95,
        intelligenceLevel: guessIntelligence(slug),
        discoveredAt: now,
        availability: true,
      });
    }
    return { discovered: slugs.length };
  }

  clear(): void {
    this.models.clear();
  }
}

export const modelRegistry = new ModelRegistry();
