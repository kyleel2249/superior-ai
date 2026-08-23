import type { ProviderId, ModelStatus } from "@superior-ai/core";

export interface ProviderCredentials {
  apiKey?: string;
  baseUrl?: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  tools?: unknown;
  response_format?: unknown;
}

export interface ChatCompletionResponse {
  id: string;
  model: string;
  content: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  finish_reason?: string;
  raw?: unknown;
}

export interface HealthCheckResult {
  ok: boolean;
  status: ModelStatus;
  latencyMs?: number;
  message?: string;
  modelsDiscovered?: string[];
}

/**
 * Every concrete adapter (currently just OpenRouter) implements this.
 * Kept as an abstract base — per docs/ARCHITECTURE.md's "model-agnostic
 * core" principle — so a direct vendor adapter can be added later
 * without touching the router or registry.
 */
export abstract class BaseProviderAdapter {
  abstract readonly providerId: ProviderId;
  abstract readonly displayName: string;

  protected credentials: ProviderCredentials = {};
  protected validated = false;

  setCredentials(credentials: ProviderCredentials): void {
    this.credentials = credentials;
    this.validated = false;
  }

  isConfigured(): boolean {
    return Boolean(this.credentials.apiKey);
  }

  abstract healthCheck(): Promise<HealthCheckResult>;
  abstract listModels(): Promise<string[]>;
  abstract chat(req: ChatCompletionRequest): Promise<ChatCompletionResponse>;
}
