import {
  BaseProviderAdapter,
  type HealthCheckResult,
  type ChatCompletionRequest,
  type ChatCompletionResponse,
} from "./base";
import type { ProviderId } from "@superior-ai/core";

/**
 * Targets any OpenAI-compatible local server (Ollama, vLLM, LM Studio, etc).
 * Unlike the hosted providers, a missing API key is not a configuration error
 * here — most local servers don't require one — but a missing base URL is.
 */
export class LocalAdapter extends BaseProviderAdapter {
  readonly providerId: ProviderId = "local";
  readonly displayName = "Local Inference";

  private base(): string | undefined {
    return this.credentials.baseUrl || process.env.LOCAL_INFERENCE_URL;
  }

  private headers(): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.credentials.apiKey) headers.Authorization = `Bearer ${this.credentials.apiKey}`;
    return headers;
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const base = this.base();
    if (!base) {
      return { ok: false, status: "CONFIGURATION_REQUIRED", message: "LOCAL_INFERENCE_URL missing" };
    }
    const start = Date.now();
    try {
      const res = await fetch(`${base}/models`, { headers: this.headers() });
      const latencyMs = Date.now() - start;
      if (!res.ok) {
        const text = await res.text();
        return { ok: false, status: "HEALTH_CHECK_FAILED", latencyMs, message: `HTTP ${res.status}: ${text.slice(0, 200)}` };
      }
      const data = (await res.json()) as { data?: Array<{ id: string }> };
      const models = (data.data ?? []).map((m) => m.id).slice(0, 200);
      this.validated = true;
      return { ok: true, status: "AVAILABLE", latencyMs, modelsDiscovered: models, message: `${this.displayName} endpoint validated` };
    } catch (err) {
      return { ok: false, status: "HEALTH_CHECK_FAILED", latencyMs: Date.now() - start, message: err instanceof Error ? err.message : String(err) };
    }
  }

  async listModels(): Promise<string[]> {
    const hc = await this.healthCheck();
    return hc.modelsDiscovered ?? [];
  }

  async chat(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const base = this.base();
    if (!base) throw new Error("LOCAL_INFERENCE_URL not configured");
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        model: req.model,
        messages: req.messages,
        temperature: req.temperature ?? 0.7,
        max_tokens: req.max_tokens,
        stream: false,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${this.displayName} chat failed: ${res.status} ${text.slice(0, 300)}`);
    }
    const data = (await res.json()) as {
      id?: string;
      model?: string;
      choices: Array<{ message: { content: string }; finish_reason: string }>;
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };
    return {
      id: data.id || `local_${Date.now()}`,
      model: data.model || req.model,
      content: data.choices[0]?.message?.content ?? "",
      usage: data.usage,
      finish_reason: data.choices[0]?.finish_reason,
      raw: data,
    };
  }
}
