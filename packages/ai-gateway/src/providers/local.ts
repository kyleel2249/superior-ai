import { BaseProviderAdapter, type HealthCheckResult, type ChatCompletionRequest, type ChatCompletionResponse } from "./base";
import type { ProviderId } from "@superior-ai/core";

/** OpenAI-compatible local servers: Ollama, vLLM, LM Studio, llama.cpp */
export class LocalAdapter extends BaseProviderAdapter {
  readonly providerId: ProviderId = "local";
  readonly displayName = "Local Inference";

  async healthCheck(): Promise<HealthCheckResult> {
    const base = this.credentials.baseUrl || process.env.LOCAL_INFERENCE_URL || "http://localhost:11434/v1";
    const start = Date.now();
    try {
      const headers: Record<string, string> = {};
      if (this.credentials.apiKey) headers.Authorization = `Bearer ${this.credentials.apiKey}`;
      const res = await fetch(`${base}/models`, { headers });
      const latencyMs = Date.now() - start;
      if (!res.ok) {
        return { ok: false, status: "HEALTH_CHECK_FAILED", latencyMs, message: `Local endpoint HTTP ${res.status}` };
      }
      const data = (await res.json()) as { data?: Array<{ id: string }> };
      this.validated = true;
      return { ok: true, status: "AVAILABLE", latencyMs, modelsDiscovered: (data.data ?? []).map((m) => m.id) };
    } catch (err) {
      return {
        ok: false,
        status: "CONFIGURATION_REQUIRED",
        latencyMs: Date.now() - start,
        message: `Local inference unreachable: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  async listModels(): Promise<string[]> {
    const hc = await this.healthCheck();
    return hc.modelsDiscovered ?? [];
  }

  async chat(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const base = this.credentials.baseUrl || process.env.LOCAL_INFERENCE_URL || "http://localhost:11434/v1";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.credentials.apiKey) headers.Authorization = `Bearer ${this.credentials.apiKey}`;
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: req.model,
        messages: req.messages,
        temperature: req.temperature ?? 0.7,
        max_tokens: req.max_tokens,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Local chat failed: ${res.status} ${text.slice(0, 300)}`);
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
