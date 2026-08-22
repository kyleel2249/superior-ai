/**
 * SUPERIOR AI — Core Domain Types
 * Model-agnostic architecture. Never hard-code model availability.
 */

export type ModelStatus =
  | "REGISTERED"
  | "AVAILABLE"
  | "UNAVAILABLE"
  | "DEPRECATED"
  | "CONFIGURATION_REQUIRED"
  | "HEALTH_CHECK_FAILED";

export type ProviderId =
  | "openai"
  | "anthropic"
  | "xai"
  | "google"
  | "openrouter"
  | "azure-openai"
  | "local"
  | "custom";

export interface ModelCapabilityScores {
  reasoning: number;      // 0-100
  coding: number;
  research: number;
  writing: number;
  vision: number;
  audio: number;
  video: number;
  mathematics: number;
  toolUse: number;
  agentic: number;
  latency: number;        // higher = faster
  cost: number;           // higher = cheaper
  reliability: number;
  freshness: number;
}

export interface ModelDefinition {
  id: string;             // internal UUID
  provider: ProviderId;
  modelId: string;        // provider-native ID e.g. "gpt-5.6-sol"
  displayName: string;
  version?: string;
  status: ModelStatus;
  availability: boolean;
  contextWindow: number;
  maxOutput: number;
  scores: ModelCapabilityScores;
  multimodalSupport: boolean;
  functionCalling: boolean;
  structuredOutput: boolean;
  webAccess: boolean;
  codeExecution: boolean;
  fileAccess: boolean;
  computerUse: boolean;
  rateLimitRpm?: number;
  priority: number;
  fallbackPriority: number;
  healthScore: number;    // 0-100 live
  aliases?: string[];     // e.g. ["GPT-7", "gpt-7"] for future routing
  metadata?: Record<string, unknown>;
  lastValidatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderDefinition {
  id: ProviderId;
  displayName: string;
  baseUrl: string;
  status: ModelStatus;
  healthScore: number;
  supportsStreaming: boolean;
  supportsTools: boolean;
  keyPoolEnabled: boolean;
  lastHealthCheckAt?: string;
  errorMessage?: string;
}

export type IntelligenceLevel =
  | "FAST"
  | "BALANCED"
  | "DEEP"
  | "EXPERT"
  | "MAXIMUM"
  | "AUTONOMOUS";

export type TaskType =
  | "chat"
  | "coding"
  | "research"
  | "analysis"
  | "financial"
  | "strategy"
  | "creative"
  | "document"
  | "multimodal"
  | "deployment"
  | "automation"
  | "other";

export interface RoutingRequest {
  taskType: TaskType;
  difficulty: 1 | 2 | 3 | 4 | 5;
  risk: "low" | "medium" | "high" | "critical";
  requiredReasoning: boolean;
  requiredTools: string[];
  requiredModality: ("text" | "image" | "audio" | "video" | "code")[];
  costSensitivity: "low" | "medium" | "high";
  latencySensitivity: "low" | "medium" | "high";
  privacyLevel: "standard" | "elevated" | "strict";
  intelligenceLevel: IntelligenceLevel;
  contextTokensEstimate?: number;
}

export interface RoutingDecision {
  primary: ModelDefinition;
  secondary?: ModelDefinition;
  critic?: ModelDefinition;
  factCheck?: ModelDefinition;
  executor?: ModelDefinition;
  fallback: ModelDefinition[];
  emergency?: ModelDefinition;
  reason: string;
  estimatedCostUsd?: number;
}

export type AgentRole =
  | "executive"
  | "strategist"
  | "researcher"
  | "software-architect"
  | "lead-developer"
  | "frontend-developer"
  | "backend-developer"
  | "fullstack-developer"
  | "mobile-developer"
  | "devops"
  | "security-engineer"
  | "qa-engineer"
  | "code-reviewer"
  | "ceo-advisor"
  | "cfo-advisor"
  | "cmo-advisor"
  | "financial-analyst"
  | "business-analyst"
  | "copywriter"
  | "ux-designer"
  | "security-council"
  | "custom";

export interface AgentDefinition {
  id: string;
  role: AgentRole;
  displayName: string;
  description: string;
  preferredModels: string[]; // modelIds or aliases
  tools: string[];
  systemPrompt: string;
  permissions: string[];
  maxParallel?: number;
}

export type TaskStage =
  | "planning"
  | "researching"
  | "delegating"
  | "coding"
  | "testing"
  | "reviewing"
  | "waiting_provider"
  | "retrying"
  | "fallback_active"
  | "awaiting_approval"
  | "completed"
  | "failed"
  | "paused";

export interface TaskCheckpoint {
  taskId: string;
  stage: TaskStage;
  completedSteps: string[];
  pendingSteps: string[];
  state: Record<string, unknown>;
  artifacts: string[];
  modelUsed?: string;
  tokenUsage?: { input: number; output: number; cached?: number };
  costUsd?: number;
  errors: Array<{ at: string; message: string; provider?: string }>;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export type ApprovalPolicy =
  | "always_ask"
  | "sensitive_only"
  | "financial_only"
  | "external_comms"
  | "production_deploy"
  | "fully_autonomous";

export interface UsageEvent {
  id: string;
  organizationId?: string;
  userId?: string;
  projectId?: string;
  provider: ProviderId;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens?: number;
  estimatedCostUsd: number;
  latencyMs: number;
  success: boolean;
  taskId?: string;
  agentRole?: AgentRole;
  createdAt: string;
}
