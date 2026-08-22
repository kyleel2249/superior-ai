import {
  BaseProviderAdapter,
  type HealthCheckResult,
  type ChatCompletionRequest,
  type ChatCompletionResponse,
} from "./base";
import type { ProviderId } from "@superior-ai/core";

export class OpenRouterAdapter extends BaseProviderAdapter {
  readonly providerId: ProviderId = "openrouter";
  readonly displayName = "OpenRouter";

  private base(): string {
    return (
      this.credentials.baseUrl ||
      process.env.OPENROUTER_BASE_URL ||
      "https://openrouter.ai/api/v1"
    );
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.credentials.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer":
        process.env.OPENROUTER_HTTP_REFERER ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "https://superior-ai.local",
      "X-Title": process.env.OPENROUTER_APP_TITLE || "SUPERIOR AI",
    };
  }

  async healthCheck(): Promise<HealthCheckResult> {
    if (!this.credentials.apiKey) {
      return { ok: false, status: "CONFIGURATION_REQUIRED", message: "OPENROUTER_API_KEY missing" };
    }
    const start = Date.now();
    try {
      const res = await fetch(`${this.base()}/models`, { headers: this.headers() });
      const latencyMs = Date.now() - start;
      if (!res.ok) {
        const text = await res.text();
        return { ok: false, status: "HEALTH_CHECK_FAILED", latencyMs, message: `HTTP ${res.status}: ${text.slice(0, 200)}` };
      }
      const data = (await res.json()) as { data?: Array<{ id: string }> };
      const models = (data.data ?? []).map((m) => m.id).slice(0, 200);
      this.validated = true;
      return { ok: true, status: "AVAILABLE", latencyMs, modelsDiscovered: models, message: "OpenRouter endpoint validated" };
    } catch (err) {
      return {
        ok: false,
        status: "HEALTH_CHECK_FAILED",
        latencyMs: Date.now() - start,
        message: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async listModels(): Promise<string[]> {
    const hc = await this.healthCheck();
    return hc.modelsDiscovered ?? [];
  }

  async chat(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    if (!this.credentials.apiKey) throw new Error("OpenRouter API key not configured");
    const res = await fetch(`${this.base()}/chat/completions`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        model: req.model,
        messages: req.messages,
        temperature: req.temperature ?? 0.7,
        max_tokens: req.max_tokens,
        stream: false,
        tools: req.tools,
        response_format: req.response_format,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenRouter chat failed: ${res.status} ${text.slice(0, 300)}`);
    }
    const data = (await res.json()) as {
      id: string;
      model: string;
      choices: Array<{ message: { content: string }; finish_reason: string }>;
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };
    return {
      id: data.id,
      model: data.model,
      content: data.choices[0]?.message?.content ?? "",
      usage: data.usage,
      finish_reason: data.choices[0]?.finish_reason,
      raw: data,
    };
  }
}
