import type { ProviderId, ModelStatus } from "@superior-ai/core";

/**
 * This contract was reconstructed from packages/ai-gateway/src/providers/openrouter.ts,
 * which was the one adapter that already existed complete in the repo. Every other
 * adapter (openai/anthropic/xai/google/local) is written to satisfy this exact shape.
 */

export interface ProviderCredentials {
  apiKey?: string;
  baseUrl?: string;
}

export interface HealthCheckResult {
  ok: boolean;
  status: ModelStatus;
  latencyMs?: number;
  modelsDiscovered?: string[];
  message?: string;
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

export abstract class BaseProviderAdapter {
  abstract readonly providerId: ProviderId;
  abstract readonly displayName: string;

  protected credentials: ProviderCredentials = {};
  protected validated = false;

  setCredentials(credentials: ProviderCredentials): void {
    this.credentials = credentials;
    this.validated = false;
  }

  abstract healthCheck(): Promise<HealthCheckResult>;
  abstract listModels(): Promise<string[]>;
  abstract chat(req: ChatCompletionRequest): Promise<ChatCompletionResponse>;
}
