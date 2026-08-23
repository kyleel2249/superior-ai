import {
  BaseProviderAdapter,
  type HealthCheckResult,
  type ChatCompletionRequest,
  type ChatCompletionResponse,
} from "./base";
import type { ProviderId } from "@superior-ai/core";

export class GoogleAdapter extends BaseProviderAdapter {
  readonly providerId: ProviderId = "google";
  readonly displayName = "Google";

  private base(): string {
    return this.credentials.baseUrl || process.env.GOOGLE_AI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta";
  }

  async healthCheck(): Promise<HealthCheckResult> {
    if (!this.credentials.apiKey) {
      return { ok: false, status: "CONFIGURATION_REQUIRED", message: `${this.displayName} API key missing` };
    }
    const start = Date.now();
    try {
      const res = await fetch(`${this.base()}/models?key=${this.credentials.apiKey}`);
      const latencyMs = Date.now() - start;
      if (!res.ok) {
        const text = await res.text();
        return { ok: false, status: "HEALTH_CHECK_FAILED", latencyMs, message: `HTTP ${res.status}: ${text.slice(0, 200)}` };
      }
      const data = (await res.json()) as { models?: Array<{ name: string }> };
      const models = (data.models ?? []).map((m) => m.name.replace(/^models\//, "")).slice(0, 200);
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
    if (!this.credentials.apiKey) throw new Error(`${this.displayName} API key not configured`);
    const system = req.messages.find((m) => m.role === "system")?.content;
    const contents = req.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
    const res = await fetch(`${this.base()}/models/${req.model}:generateContent?key=${this.credentials.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: system ? { parts: [{ text: system }] } : undefined,
        generationConfig: {
          temperature: req.temperature ?? 0.7,
          maxOutputTokens: req.max_tokens,
        },
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${this.displayName} chat failed: ${res.status} ${text.slice(0, 300)}`);
    }
    const data = (await res.json()) as {
      candidates: Array<{ content: { parts: Array<{ text?: string }> }; finishReason: string }>;
      usageMetadata?: { promptTokenCount: number; candidatesTokenCount: number; totalTokenCount: number };
    };
    const first = data.candidates?.[0];
    const content = (first?.content?.parts ?? []).map((p) => p.text ?? "").join("");
    return {
      id: `gemini_${Date.now()}`,
      model: req.model,
      content,
      usage: data.usageMetadata
        ? {
            prompt_tokens: data.usageMetadata.promptTokenCount,
            completion_tokens: data.usageMetadata.candidatesTokenCount,
            total_tokens: data.usageMetadata.totalTokenCount,
          }
        : undefined,
      finish_reason: first?.finishReason,
      raw: data,
    };
  }
}
