import { BaseProviderAdapter, type HealthCheckResult, type ChatCompletionRequest, type ChatCompletionResponse } from "./base";
import type { ProviderId } from "@superior-ai/core";

/** xAI Grok — OpenAI-compatible endpoint style */
export class XAIAdapter extends BaseProviderAdapter {
  readonly providerId: ProviderId = "xai";
  readonly displayName = "xAI";

  async healthCheck(): Promise<HealthCheckResult> {
    if (!this.credentials.apiKey) {
      return { ok: false, status: "CONFIGURATION_REQUIRED", message: "XAI_API_KEY missing" };
    }
    const base = this.credentials.baseUrl || "https://api.x.ai/v1";
    const start = Date.now();
    try {
      const res = await fetch(`${base}/models`, {
        headers: { Authorization: `Bearer ${this.credentials.apiKey}` },
      });
      const latencyMs = Date.now() - start;
      if (!res.ok) {
        return { ok: false, status: "HEALTH_CHECK_FAILED", latencyMs, message: `HTTP ${res.status}` };
      }
      const data = (await res.json()) as { data?: Array<{ id: string }> };
      this.validated = true;
      return { ok: true, status: "AVAILABLE", latencyMs, modelsDiscovered: (data.data ?? []).map((m) => m.id) };
    } catch (err) {
      return { ok: false, status: "HEALTH_CHECK_FAILED", latencyMs: Date.now() - start, message: String(err) };
    }
  }

  async listModels(): Promise<string[]> {
    const hc = await this.healthCheck();
    return hc.modelsDiscovered ?? ["grok-4.6", "grok-4.5"];
  }

  async chat(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    if (!this.credentials.apiKey) throw new Error("xAI API key not configured");
    const base = this.credentials.baseUrl || "https://api.x.ai/v1";
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.credentials.apiKey}`,
      },
      body: JSON.stringify({
        model: req.model,
        messages: req.messages,
        temperature: req.temperature ?? 0.7,
        max_tokens: req.max_tokens,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`xAI chat failed: ${res.status} ${text.slice(0, 300)}`);
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
