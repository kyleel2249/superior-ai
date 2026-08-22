import { BaseProviderAdapter, type HealthCheckResult, type ChatCompletionRequest, type ChatCompletionResponse } from "./base";
import type { ProviderId } from "@superior-ai/core";

export class AnthropicAdapter extends BaseProviderAdapter {
  readonly providerId: ProviderId = "anthropic";
  readonly displayName = "Anthropic";

  async healthCheck(): Promise<HealthCheckResult> {
    if (!this.credentials.apiKey) {
      return { ok: false, status: "CONFIGURATION_REQUIRED", message: "ANTHROPIC_API_KEY missing" };
    }
    const base = this.credentials.baseUrl || "https://api.anthropic.com";
    const start = Date.now();
    try {
      // Minimal validation call
      const res = await fetch(`${base}/v1/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.credentials.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-5",
          max_tokens: 1,
          messages: [{ role: "user", content: "ping" }],
        }),
      });
      const latencyMs = Date.now() - start;
      // 200 or even 400 (bad model) still proves auth works; 401/403 = bad key
      if (res.status === 401 || res.status === 403) {
        return { ok: false, status: "HEALTH_CHECK_FAILED", latencyMs, message: "Invalid API key" };
      }
      this.validated = true;
      return { ok: true, status: "AVAILABLE", latencyMs, message: "Anthropic endpoint reachable" };
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
    // Anthropic does not expose a public list endpoint the same way; return known registry IDs
    return ["claude-opus-5", "claude-sonnet-5", "claude-fable-5", "claude-haiku-4-5"];
  }

  async chat(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    if (!this.credentials.apiKey) throw new Error("Anthropic API key not configured");
    const base = this.credentials.baseUrl || "https://api.anthropic.com";
    const system = req.messages.find((m) => m.role === "system")?.content;
    const messages = req.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));

    const res = await fetch(`${base}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.credentials.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: req.model,
        max_tokens: req.max_tokens ?? 4096,
        system,
        messages,
        temperature: req.temperature,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Anthropic chat failed: ${res.status} ${text.slice(0, 300)}`);
    }
    const data = (await res.json()) as {
      id: string;
      model: string;
      content: Array<{ type: string; text?: string }>;
      usage?: { input_tokens: number; output_tokens: number };
      stop_reason?: string;
    };
    const content = data.content?.map((c) => c.text ?? "").join("") ?? "";
    return {
      id: data.id,
      model: data.model,
      content,
      usage: data.usage
        ? { prompt_tokens: data.usage.input_tokens, completion_tokens: data.usage.output_tokens, total_tokens: data.usage.input_tokens + data.usage.output_tokens }
        : undefined,
      finish_reason: data.stop_reason,
      raw: data,
    };
  }
}
