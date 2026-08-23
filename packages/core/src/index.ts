/**
 * @superior-ai/core
 *
 * This package did not exist anywhere in the repo, despite 9 other packages
 * either declaring it as a dependency or importing types from it directly
 * (ai-gateway). The types below were reconstructed from actual call-site
 * usage, not invented from scratch — see the comment on each type for the
 * evidence. Anything not directly evidenced is marked INFERRED and should
 * be reviewed before you rely on it.
 */

/**
 * EVIDENCE: packages/ai-gateway/src/providers/index.ts builds a
 * Record<ProviderId, BaseProviderAdapter> with exactly these 8 keys.
 */
export type ProviderId =
  | "openai"
  | "anthropic"
  | "xai"
  | "google"
  | "local"
  | "openrouter"
  | "azure-openai"
  | "custom";

/**
 * EVIDENCE: "AVAILABLE", "UNAVAILABLE", "CONFIGURATION_REQUIRED" are used in
 * health/monitor.ts and providers/index.ts; "HEALTH_CHECK_FAILED" is used in
 * providers/openrouter.ts (the one adapter that already existed in full).
 * INFERRED: DEGRADED / RATE_LIMITED / ERROR are added as plausible additional
 * states for a provider health system but have no call-site evidence yet.
 */
export type ModelStatus =
  | "AVAILABLE"
  | "UNAVAILABLE"
  | "CONFIGURATION_REQUIRED"
  | "HEALTH_CHECK_FAILED"
  | "DEGRADED"
  | "RATE_LIMITED"
  | "ERROR";

/**
 * EVIDENCE: "BALANCED" is used as a literal IntelligenceLevel in
 * openai-compat.ts's routing decision.
 * INFERRED: FAST / POWERFUL / REASONING follow the same low-to-high pattern
 * implied by a "BALANCED" midpoint — no other call-site evidence yet.
 */
export type IntelligenceLevel = "FAST" | "BALANCED" | "POWERFUL" | "REASONING";

/**
 * EVIDENCE: "chat" is used as a literal TaskType in openai-compat.ts.
 * INFERRED: the other values are drawn from apps/web/src/app/api routes that
 * already exist in the repo (images, video, exec/code, knowledge) — not
 * confirmed against any TaskType-consuming router logic since the router
 * (ai-gateway/src/router/superior-router.ts) doesn't exist yet.
 */
export type TaskType =
  | "chat"
  | "completion"
  | "embedding"
  | "image"
  | "video"
  | "code"
  | "audio"
  | "moderation";
