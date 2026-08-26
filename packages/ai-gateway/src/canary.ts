/**
 * Model sandbox + canary promotion
 * DISCOVERED → EVALUATING → APPROVED → ACTIVE (with canary %)
 */

import type { ModelStatus } from "@superior-ai/core";
import { modelRegistry } from "./registry/model-registry";

export type LifecycleState =
  | "DISCOVERED"
  | "EVALUATING"
  | "APPROVED"
  | "ACTIVE"
  | "LIMITED"
  | "DEGRADED"
  | "DEPRECATED"
  | "RETIRED";

export interface CanaryConfig {
  modelId: string;
  percent: 1 | 5 | 10 | 25 | 50 | 100;
  startedAt: string;
  metrics: {
    requests: number;
    failures: number;
    avgQuality?: number;
  };
  autoRollbackBelowQuality?: number;
}

const lifecycle = new Map<string, LifecycleState>();
const canaries = new Map<string, CanaryConfig>();
const sandboxResults = new Map<
  string,
  { passed: boolean; checks: string[]; at: string; notes: string[] }
>();

export function setLifecycle(modelId: string, state: LifecycleState): void {
  lifecycle.set(modelId, state);
  const statusMap: Partial<Record<LifecycleState, ModelStatus>> = {
    DISCOVERED: "REGISTERED",
    EVALUATING: "CONFIGURATION_REQUIRED",
    APPROVED: "CONFIGURATION_REQUIRED",
    ACTIVE: "AVAILABLE",
    LIMITED: "AVAILABLE",
    DEGRADED: "HEALTH_CHECK_FAILED",
    DEPRECATED: "DEPRECATED",
    RETIRED: "UNAVAILABLE",
  };
  const st = statusMap[state];
  if (st) {
    const m = modelRegistry.get(modelId);
    if (m) modelRegistry.updateStatus(m.id, st);
  }
}

export function getLifecycle(modelId: string): LifecycleState {
  return lifecycle.get(modelId) ?? "DISCOVERED";
}

export function runSandboxChecks(modelId: string): {
  passed: boolean;
  checks: string[];
  at: string;
  notes: string[];
} {
  const m = modelRegistry.get(modelId);
  const checks: string[] = [];
  const notes: string[] = [];
  if (!m) {
    const r = {
      passed: false,
      checks: ["model_registered"],
      at: new Date().toISOString(),
      notes: ["Model not in registry"],
    };
    sandboxResults.set(modelId, r);
    return r;
  }
  checks.push("model_registered:pass");
  if (m.metadata?.kind === "product_tier") {
    notes.push("Product tier — not a foundation model for canary traffic");
    const r = { passed: false, checks, at: new Date().toISOString(), notes };
    sandboxResults.set(modelId, r);
    return r;
  }
  checks.push("not_product_tier:pass");
  if (m.scores.reliability >= 40) checks.push("reliability_floor:pass");
  else {
    checks.push("reliability_floor:fail");
    notes.push("Reliability score below floor");
  }
  if (m.contextWindow > 0) checks.push("context_window:pass");
  const failed = checks.some((c) => c.endsWith(":fail"));
  const r = {
    passed: !failed,
    checks,
    at: new Date().toISOString(),
    notes,
  };
  sandboxResults.set(modelId, r);
  if (r.passed) setLifecycle(modelId, "EVALUATING");
  return r;
}

export function promoteFromSandbox(modelId: string): { ok: boolean; state: LifecycleState } {
  const sb = sandboxResults.get(modelId);
  if (!sb?.passed) return { ok: false, state: getLifecycle(modelId) };
  setLifecycle(modelId, "APPROVED");
  return { ok: true, state: "APPROVED" };
}

export function startCanary(
  modelId: string,
  percent: CanaryConfig["percent"] = 5
): CanaryConfig {
  const cfg: CanaryConfig = {
    modelId,
    percent,
    startedAt: new Date().toISOString(),
    metrics: { requests: 0, failures: 0 },
    autoRollbackBelowQuality: 60,
  };
  canaries.set(modelId, cfg);
  setLifecycle(modelId, percent === 100 ? "ACTIVE" : "LIMITED");
  return cfg;
}

export function recordCanaryOutcome(
  modelId: string,
  ok: boolean,
  quality?: number
): CanaryConfig | null {
  const cfg = canaries.get(modelId);
  if (!cfg) return null;
  cfg.metrics.requests += 1;
  if (!ok) cfg.metrics.failures += 1;
  if (quality != null) {
    const prev = cfg.metrics.avgQuality ?? quality;
    cfg.metrics.avgQuality = Math.round((prev * 0.8 + quality * 0.2) * 10) / 10;
  }
  if (
    cfg.autoRollbackBelowQuality != null &&
    cfg.metrics.avgQuality != null &&
    cfg.metrics.avgQuality < cfg.autoRollbackBelowQuality &&
    cfg.metrics.requests >= 10
  ) {
    setLifecycle(modelId, "DEGRADED");
    canaries.delete(modelId);
  }
  return cfg;
}

export function advanceCanary(modelId: string): CanaryConfig | null {
  const cfg = canaries.get(modelId);
  if (!cfg) return null;
  const ladder: CanaryConfig["percent"][] = [1, 5, 10, 25, 50, 100];
  const i = ladder.indexOf(cfg.percent);
  const next = ladder[Math.min(ladder.length - 1, i + 1)]!;
  cfg.percent = next;
  if (next === 100) setLifecycle(modelId, "ACTIVE");
  return cfg;
}

export function listCanaries(): CanaryConfig[] {
  return [...canaries.values()];
}

export function getSandboxResult(modelId: string) {
  return sandboxResults.get(modelId);
}
