/**
 * Base Provider Adapter
 * Never mark Connected / AVAILABLE without validation.
 */

import type { ProviderId, ModelStatus } from "@superior-ai/core";

export interface ProviderCredentials {
  apiKey?: string;
  orgId?: string;
  baseUrl?: string;
  extra?: Record<string, string>;
}

export interface HealthCheckResult {
  ok: boolean;
  status: ModelStatus;
  latencyMs?: number;
  message?: string;
  modelsDiscovered?: string[];
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  tool_call_id?: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  tools?: unknown[];
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

  setCredentials(creds: ProviderCredentials): void {
    this.credentials = creds;
    this.validated = false;
  }

  abstract healthCheck(): Promise<HealthCheckResult>;
  abstract listModels(): Promise<string[]>;
  abstract chat(req: ChatCompletionRequest): Promise<ChatCompletionResponse>;

  async *chatStream(req: ChatCompletionRequest): AsyncGenerator<string, void, unknown> {
    const res = await this.chat({ ...req, stream: false });
    yield res.content;
  }

  isValidated(): boolean {
    return this.validated;
  }
}
