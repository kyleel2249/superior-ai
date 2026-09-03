/**
 * OpenAI-Compatible Gateway
 * Applications can point at SUPERIOR AI instead of a single provider.
 * POST /v1/chat/completions style handler logic.
 */

import { route } from "../router/superior-router";
import { getAdapter } from "../providers";
import { modelRegistry } from "../registry/model-registry";
import type { IntelligenceLevel, TaskType } from "@superior-ai/core";

export interface OpenAICompatRequest {
  model?: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface OpenAICompatResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: { role: "assistant"; content: string };
    finish_reason: string;
  }>;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  superior_meta?: {
    routed_model: string;
    provider: string;
    reason: string;
  };
}

export async function handleChatCompletions(body: OpenAICompatRequest): Promise<OpenAICompatResponse> {
  const requested = body.model ?? "auto";
  let modelId = requested;

  if (requested === "auto" || requested === "superior" || requested === "superior-ai") {
    const decision = route({
      taskType: "chat" as TaskType,
      difficulty: 3,
      risk: "medium",
      requiredReasoning: true,
      requiredTools: [],
      requiredModality: ["text"],
      costSensitivity: "medium",
      latencySensitivity: "medium",
      privacyLevel: "standard",
      intelligenceLevel: "BALANCED" as IntelligenceLevel,
    });
    modelId = decision.primary.modelId;
    const adapter = getAdapter(decision.primary.provider);
    const completion = await adapter.chat({
      model: modelId,
      messages: body.messages.map((m) => ({
        role: m.role as "system" | "user" | "assistant" | "tool",
        content: m.content,
      })),
      temperature: body.temperature,
      max_tokens: body.max_tokens,
    });
    return {
      id: completion.id || `chatcmpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: completion.model || modelId,
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: completion.content },
          finish_reason: completion.finish_reason || "stop",
        },
      ],
      usage: completion.usage,
      superior_meta: {
        routed_model: decision.primary.displayName,
        provider: decision.primary.provider,
        reason: decision.reason,
      },
    };
  }

  // Resolve alias / registry
  const resolved = modelRegistry.resolve(requested);
  const target = resolved.resolved;
  if (!target || !target.availability) {
    throw new Error(
      `Model "${requested}" status=${resolved.status}. Configure a provider or use model "auto".`
    );
  }

  const adapter = getAdapter(target.provider);
  const completion = await adapter.chat({
    model: target.modelId,
    messages: body.messages.map((m) => ({
      role: m.role as "system" | "user" | "assistant" | "tool",
      content: m.content,
    })),
    temperature: body.temperature,
    max_tokens: body.max_tokens,
  });

  return {
    id: completion.id || `chatcmpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: completion.model || target.modelId,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: completion.content },
        finish_reason: completion.finish_reason || "stop",
      },
    ],
    usage: completion.usage,
    superior_meta: {
      routed_model: target.displayName,
      provider: target.provider,
      reason: `Direct request resolved from ${requested}`,
    },
  };
}
