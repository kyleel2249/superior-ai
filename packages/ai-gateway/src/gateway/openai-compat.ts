/** OpenAI-Compatible Gateway — point apps at SUPERIOR AI */
import { route } from "../router/superior-router";
import { getAdapter } from "../providers";
import { modelRegistry } from "../registry/model-registry";
import type { IntelligenceLevel, TaskType } from "@superior-ai/core";

export interface OpenAICompatRequest {
  model?: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
}

export async function handleChatCompletions(body: OpenAICompatRequest) {
  const requested = body.model ?? "auto";
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
    const adapter = getAdapter(decision.primary.provider);
    const completion = await adapter.chat({
      model: decision.primary.modelId,
      messages: body.messages.map((m) => ({ role: m.role as "system" | "user" | "assistant" | "tool", content: m.content })),
      temperature: body.temperature,
      max_tokens: body.max_tokens,
    });
    return {
      id: completion.id || `chatcmpl_${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: completion.model || decision.primary.modelId,
      choices: [{ index: 0, message: { role: "assistant", content: completion.content }, finish_reason: completion.finish_reason || "stop" }],
      usage: completion.usage,
      superior_meta: { routed_model: decision.primary.displayName, provider: decision.primary.provider, reason: decision.reason },
    };
  }
  const resolved = modelRegistry.resolve(requested);
  const target = resolved.resolved;
  if (!target || !target.availability) throw new Error(`Model "${requested}" status=${resolved.status}. Use model "auto" or configure provider.`);
  const adapter = getAdapter(target.provider);
  const completion = await adapter.chat({
    model: target.modelId,
    messages: body.messages.map((m) => ({ role: m.role as "system" | "user" | "assistant" | "tool", content: m.content })),
    temperature: body.temperature,
    max_tokens: body.max_tokens,
  });
  return {
    id: completion.id || `chatcmpl_${Date.now()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: completion.model || target.modelId,
    choices: [{ index: 0, message: { role: "assistant", content: completion.content }, finish_reason: completion.finish_reason || "stop" }],
    usage: completion.usage,
    superior_meta: { routed_model: target.displayName, provider: target.provider, reason: `Resolved from ${requested}` },
  };
}
