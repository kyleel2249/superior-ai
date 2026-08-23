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
  | "SUPREME"
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

// ─── Media & Creative Studio ───────────────────────────────────────────────

export type CreativeFormat =
  | "image"
  | "video"
  | "ugc"
  | "skit"
  | "carousel"
  | "story"
  | "reel"
  | "short"
  | "long_form"
  | "thumbnail"
  | "banner"
  | "product_render";

export type Platform =
  | "tiktok"
  | "instagram"
  | "facebook"
  | "linkedin"
  | "youtube"
  | "x"
  | "pinterest"
  | "web"
  | "email"
  | "whatsapp";

export type AspectRatio = "1:1" | "4:5" | "9:16" | "16:9" | "3:2" | "21:9";

export type CreativeStyle =
  | "studio_commercial"
  | "ugc"
  | "influencer"
  | "founder_story"
  | "customer_testimonial"
  | "documentary"
  | "cinematic"
  | "social_native"
  | "skit"
  | "explainer";

export type ResolutionLabel = "Native Resolution" | "Upscaled Resolution" | "Final Resolution";

export interface ImageGenerationSpec {
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  nativeWidth?: number;
  nativeHeight?: number;
  upscaled: boolean;
  resolutionLabel: ResolutionLabel;
  realismMode: boolean;
  camera?: string;
  lens?: string;
  focalLength?: string;
  lighting?: string;
  style: CreativeStyle;
  brandCompliant: boolean;
}

export interface VideoScene {
  id: string;
  order: number;
  description: string;
  durationSec: number;
  dialogue?: string;
  cameraMovement?: string;
  emotion?: string;
  productPlacement?: boolean;
  continuityKeys: string[]; // character, wardrobe,environment ids
}

export interface StoryBoard {
  objective: string;
  characterObjective: string;
  audienceEmotion: string;
  visualObjective: string;
  salesObjective: string;
  hook: string;
  scenes: VideoScene[];
  conflict: string;
  solution: string;
  socialProof?: string;
  cta: string;
  ending: string;
}

export interface CreativeAsset {
  id: string;
  type: CreativeFormat;
  platform: Platform[];
  aspectRatio: AspectRatio;
  durationSec?: number;
  script?: string;
  caption?: string;
  hashtags?: string[];
  thumbnailSpec?: ImageGenerationSpec;
  imageSpec?: ImageGenerationSpec;
  storyBoard?: StoryBoard;
  style: CreativeStyle;
  performancePrediction?: CreativePerformancePrediction;
  brandProfileId?: string;
  status: "draft" | "generated" | "optimized" | "approved" | "published";
  metadata?: Record<string, unknown>;
}

export interface CreativePerformancePrediction {
  hookStrength: number;
  attentionPotential: number;
  messageClarity: number;
  emotionalAppeal: number;
  audienceRelevance: number;
  brandFit: number;
  offerStrength: number;
  ctaStrength: number;
  visualQuality: number;
  purchaseIntent: number;
  predictedCtr: number;
  predictedEngagement: number;
  predictedConversion: number;
  creativeConfidence: number;
  disclaimer: "Estimates only — not guaranteed performance";
}

export interface BrandProfile {
  id: string;
  name: string;
  logos: string[];
  colors: string[];
  fonts: string[];
  voice: string;
  products: string[];
  services: string[];
  personas: string[];
  approvedClaims: string[];
  prohibitedClaims: string[];
}

// ─── SEO ───────────────────────────────────────────────────────────────────

export interface KeywordCluster {
  pillar: string;
  keywords: Array<{ term: string; intent: string; volumeEstimate?: number; difficulty?: number }>;
  contentGaps: string[];
}

export interface SeoAuditResult {
  url: string;
  seoScore: number;
  uxScore: number;
  conversionScore: number;
  contentScore: number;
  performanceScore: number;
  accessibilityScore: number;
  trustScore: number;
  recommendations: string[];
  technicalSignals: Record<string, unknown>;
  dataQuality: "Observed Data" | "Third-Party Estimate" | "Model Inference";
  confidence: number;
}

// ─── Competitor Intelligence ───────────────────────────────────────────────

export type DataProvenance = "Observed Data" | "Third-Party Estimate" | "Model Inference";

export interface CompetitorProfile {
  id: string;
  name: string;
  website: string;
  industry?: string;
  products: string[];
  pricingSignals: string[];
  positioning: string;
  strengths: string[];
  weaknesses: string[];
  seoKeywords: string[];
  contentTopics: string[];
  socialPresence: Record<string, string>;
  trafficEstimates?: {
    sources: Record<string, number>;
    provenance: DataProvenance;
    confidence: number;
  };
  customerSentiment?: { positives: string[]; complaints: string[]; provenance: DataProvenance };
  lastResearchedAt: string;
}

export interface CompetitorScorecard {
  competitors: CompetitorProfile[];
  opportunityMap: string[];
  threatMap: string[];
  seoGap: string[];
  contentGap: string[];
  offerGap: string[];
  positioningGap: string[];
}

// ─── Sales & CRM ───────────────────────────────────────────────────────────

export type SalesAutopilotMode = "assist" | "recommend" | "semi_autonomous" | "autonomous";

export interface Lead {
  id: string;
  company: string;
  industry?: string;
  size?: string;
  location?: string;
  website?: string;
  publicContacts: string[];
  decisionMakers: string[];
  painPointHypothesis?: string;
  fitScore: number;
  opportunityScore: number;
  intentScore: number;
  engagementScore: number;
  source: string;
  confidence: number;
  status: "new" | "qualified" | "contacted" | "opportunity" | "won" | "lost";
  provenance: DataProvenance;
}

export interface Deal {
  id: string;
  leadId: string;
  title: string;
  value: number;
  currency: string;
  stage: string;
  closeProbability: number;
  expectedCloseDate?: string;
  riskScore: number;
}

export interface SalesIntelligence {
  leadScore: number;
  fitScore: number;
  intentScore: number;
  engagementScore: number;
  opportunityScore: number;
  closeProbability: number;
  expectedRevenue: number;
  expectedDaysToClose: number;
  riskScore: number;
}

// ─── Campaigns & Growth ────────────────────────────────────────────────────

export interface Campaign {
  id: string;
  objective: string;
  audience: string;
  icp: string;
  offer: string;
  platforms: Platform[];
  assets: string[]; // CreativeAsset ids
  landingPageSpec?: string;
  seoAssets?: string[];
  emailSequence?: string[];
  status: "draft" | "ready" | "live" | "paused" | "completed";
  performance?: Record<string, number>;
}

export interface GrowthExperiment {
  id: string;
  hypothesis: string;
  metric: string;
  baseline?: number;
  variants: Array<{ name: string; description: string }>;
  result?: { winner: string; lift: number };
  status: "proposed" | "running" | "completed";
}

// ─── Extended Agent Roles ──────────────────────────────────────────────────

export type DepartmentId =
  | "executive"
  | "strategy"
  | "sales"
  | "marketing"
  | "creative"
  | "technology"
  | "finance"
  | "customer"
  | "operations"
  | "hr"
  | "legal"
  | "research"
  | "seo"
  | "competitor_intel";
