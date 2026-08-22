import { BaseProviderAdapter, type HealthCheckResult, type ChatCompletionRequest, type ChatCompletionResponse } from "./base";
import type { ProviderId } from "@superior-ai/core";

export class GoogleAdapter extends BaseProviderAdapter {
  readonly providerId: ProviderId = "google";
  readonly displayName = "Google Gemini";

  async healthCheck(): Promise<HealthCheckResult> {
    if (!this.credentials.apiKey) {
      return { ok: false, status: "CONFIGURATION_REQUIRED", message: "GOOGLE_AI_API_KEY missing" };
    }
    const base = this.credentials.baseUrl || "https://generativelanguage.googleapis.com";
    const start = Date.now();
    try {
      const res = await fetch(`${base}/v1beta/models?key=${this.credentials.apiKey}`);
      const latencyMs = Date.now() - start;
      if (!res.ok) {
        return { ok: false, status: "HEALTH_CHECK_FAILED", latencyMs, message: `HTTP ${res.status}` };
      }
      const data = (await res.json()) as { models?: Array<{ name: string }> };
      const models = (data.models ?? []).map((m) => m.name.replace("models/", ""));
      this.validated = true;
      return { ok: true, status: "AVAILABLE", latencyMs, modelsDiscovered: models };
    } catch (err) {
      return { ok: false, status: "HEALTH_CHECK_FAILED", latencyMs: Date.now() - start, message: String(err) };
    }
  }

  async listModels(): Promise<string[]> {
    const hc = await this.healthCheck();
    return hc.modelsDiscovered ?? ["gemini-3.1-pro", "gemini-3.6-flash"];
  }

  async chat(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    if (!this.credentials.apiKey) throw new Error("Google AI API key not configured");
    const base = this.credentials.baseUrl || "https://generativelanguage.googleapis.com";
    const model = req.model.startsWith("models/") ? req.model : `models/${req.model}`;
    const contents = req.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
    const systemInstruction = req.messages.find((m) => m.role === "system")?.content;

    const res = await fetch(`${base}/v1beta/${model}:generateContent?key=${this.credentials.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
        generationConfig: {
          temperature: req.temperature,
          maxOutputTokens: req.max_tokens,
        },
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Gemini chat failed: ${res.status} ${text.slice(0, 300)}`);
    }
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number };
    };
    const content = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    return {
      id: `gemini-${Date.now()}`,
      model: req.model,
      content,
      usage: data.usageMetadata
        ? {
            prompt_tokens: data.usageMetadata.promptTokenCount ?? 0,
            completion_tokens: data.usageMetadata.candidatesTokenCount ?? 0,
            total_tokens: data.usageMetadata.totalTokenCount ?? 0,
          }
        : undefined,
      finish_reason: data.candidates?.[0]?.finishReason,
      raw: data,
    };
  }
}
