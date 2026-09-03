/**
 * Continuous verification loops — checkpoint quality gates on long workflows.
 */

import { evaluateQuality, type QualityReport } from "../quality/engine";

export type VerifyStage =
  | "plan"
  | "data_extraction"
  | "analysis"
  | "decision"
  | "execution"
  | "final_result";

export interface CheckpointResult {
  stage: VerifyStage;
  at: string;
  report: QualityReport;
  passed: boolean;
  threshold: number;
}

export interface VerificationLoopState {
  id: string;
  taskId: string;
  stages: VerifyStage[];
  completed: CheckpointResult[];
  status: "running" | "passed" | "failed" | "escalated";
  createdAt: string;
}

const loops = new Map<string, VerificationLoopState>();

const DEFAULT_STAGES: VerifyStage[] = [
  "plan",
  "data_extraction",
  "analysis",
  "decision",
  "execution",
  "final_result",
];

export function startVerificationLoop(
  taskId: string,
  stages: VerifyStage[] = DEFAULT_STAGES
): VerificationLoopState {
  const id = `vl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const state: VerificationLoopState = {
    id,
    taskId,
    stages,
    completed: [],
    status: "running",
    createdAt: new Date().toISOString(),
  };
  loops.set(id, state);
  return state;
}

export function verifyCheckpoint(
  loopId: string,
  stage: VerifyStage,
  outputText: string,
  opts?: { instruction?: string; threshold?: number; highRisk?: boolean }
): CheckpointResult {
  const loop = loops.get(loopId);
  if (!loop) throw new Error(`Verification loop not found: ${loopId}`);
  const threshold = opts?.threshold ?? (stage === "final_result" ? 75 : 65);
  const report = evaluateQuality({
    outputText,
    instruction: opts?.instruction,
    highRisk: opts?.highRisk,
    threshold,
  });
  const passed =
    report.qualityScore >= threshold &&
    report.recommendedAction !== "escalate_human";
  const result: CheckpointResult = {
    stage,
    at: new Date().toISOString(),
    report,
    passed,
    threshold,
  };
  loop.completed.push(result);
  if (!passed && report.recommendedAction === "escalate_human") {
    loop.status = "escalated";
  } else if (!passed) {
    loop.status = "failed";
  } else if (loop.completed.length >= loop.stages.length) {
    loop.status = loop.completed.every((c) => c.passed) ? "passed" : "failed";
  }
  return result;
}

export function getVerificationLoop(id: string): VerificationLoopState | undefined {
  return loops.get(id);
}

export function listVerificationLoops(limit = 50): VerificationLoopState[] {
  return [...loops.values()].reverse().slice(0, limit);
}
