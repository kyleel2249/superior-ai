import {
  BaseProviderAdapter,
  type HealthCheckResult,
  type ChatCompletionRequest,
  type ChatCompletionResponse,
} from "./base";
import type { ProviderId } from "@superior-ai/core";

export class AnthropicAdapter extends BaseProviderAdapter {
  readonly providerId: ProviderId = "anthropic";
  readonly displayName = "Anthropic";

  private base(): string {
    // .env.example ships ANTHROPIC_BASE_URL=https://api.anthropic.com (no /v1
    // suffix), but the Messages API lives under /v1 — normalize either form.
    const raw = this.credentials.baseUrl || process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com/v1";
    return raw.replace(/\/v1\/?$/, "") + "/v1";
  }

  private headers(): Record<string, string> {
    return {
      "x-api-key": this.credentials.apiKey ?? "",
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    };
  }

  async healthCheck(): Promise<HealthCheckResult> {
    if (!this.credentials.apiKey) {
      return { ok: false, status: "CONFIGURATION_REQUIRED", message: `${this.displayName} API key missing` };
    }
    // Anthropic has no unauthenticated /models list on all accounts; validate
    // with a minimal 1-token message instead.
    const start = Date.now();
    try {
      const res = await fetch(`${this.base()}/messages`, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({
          model: process.env.ANTHROPIC_HEALTHCHECK_MODEL || "claude-3-5-haiku-20241022",
          max_tokens: 1,
          messages: [{ role: "user", content: "ping" }],
        }),
      });
      const latencyMs = Date.now() - start;
      if (!res.ok) {
        const text = await res.text();
        return { ok: false, status: "HEALTH_CHECK_FAILED", latencyMs, message: `HTTP ${res.status}: ${text.slice(0, 200)}` };
      }
      this.validated = true;
      return { ok: true, status: "AVAILABLE", latencyMs, message: `${this.displayName} endpoint validated` };
    } catch (err) {
      return { ok: false, status: "HEALTH_CHECK_FAILED", latencyMs: Date.now() - start, message: err instanceof Error ? err.message : String(err) };
    }
  }

  async listModels(): Promise<string[]> {
    // No public model-list endpoint guaranteed across all accounts; return the
    // known current model family rather than fabricating a discovered list.
    return ["claude-opus-4-8", "claude-sonnet-5", "claude-haiku-4-5-20251001"];
  }

  async chat(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    if (!this.credentials.apiKey) throw new Error(`${this.displayName} API key not configured`);
    const system = req.messages.find((m) => m.role === "system")?.content;
    const messages = req.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));
    const res = await fetch(`${this.base()}/messages`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        model: req.model,
        system,
        messages,
        temperature: req.temperature ?? 0.7,
        max_tokens: req.max_tokens ?? 1024,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${this.displayName} chat failed: ${res.status} ${text.slice(0, 300)}`);
    }
    const data = (await res.json()) as {
      id: string;
      model: string;
      content: Array<{ type: string; text?: string }>;
      stop_reason: string;
      usage?: { input_tokens: number; output_tokens: number };
    };
    const content = data.content.filter((b) => b.type === "text").map((b) => b.text ?? "").join("");
    return {
      id: data.id,
      model: data.model,
      content,
      usage: data.usage
        ? {
            prompt_tokens: data.usage.input_tokens,
            completion_tokens: data.usage.output_tokens,
            total_tokens: data.usage.input_tokens + data.usage.output_tokens,
          }
        : undefined,
      finish_reason: data.stop_reason,
      raw: data,
    };
  }
}
