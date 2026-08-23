/**
 * Shared domain types.
 *
 * ProviderId is kept broad (rather than collapsed to just "openrouter")
 * because the model registry still tags each discovered model with the
 * vendor family it originally comes from (openai/, anthropic/, google/...).
 * That label is purely descriptive — every one of these is actually
 * reached through a single OpenRouter connection. See providers/index.ts.
 */
export type ProviderId =
  | "openai"
  | "anthropic"
  | "google"
  | "xai"
  | "meta"
  | "mistral"
  | "deepseek"
  | "local"
  | "openrouter"
  | "azure-openai"
  | "custom";

export type ModelStatus =
  | "AVAILABLE"
  | "UNAVAILABLE"
  | "CONFIGURATION_REQUIRED"
  | "HEALTH_CHECK_FAILED"
  | "RATE_LIMITED"
  | "DEPRECATED";

export type IntelligenceLevel = "FAST" | "BALANCED" | "FRONTIER";

export type TaskType =
  | "chat"
  | "code"
  | "reasoning"
  | "research"
  | "creative"
  | "vision"
  | "tool_use";

export interface RouteCriteria {
  taskType: TaskType;
  difficulty: number; // 1-5
  risk: "low" | "medium" | "high";
  requiredReasoning: boolean;
  requiredTools: string[];
  requiredModality: Array<"text" | "image" | "audio">;
  costSensitivity: "low" | "medium" | "high";
  latencySensitivity: "low" | "medium" | "high";
  privacyLevel: "standard" | "sensitive";
  intelligenceLevel: IntelligenceLevel;
}
