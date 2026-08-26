/**
 * SUPERIOR / CINTEXA Output Quality Engine
 * Scores structured dimensions; does not invent factual truth.
 */

export interface QualityDimensions {
  correctness: number;
  completeness: number;
  instructionFollowing: number;
  factualConsistency: number;
  reasoningQuality: number;
  codeQuality: number;
  security: number;
  formatCompliance: number;
  citationQuality: number;
  businessRelevance: number;
}

export interface QualityReport {
  qualityScore: number;
  confidence: number;
  dimensions: QualityDimensions;
  triggers: string[];
  recommendedAction:
    | "accept"
    | "retry"
    | "increase_reasoning"
    | "switch_model"
    | "ensemble"
    | "escalate_human";
  notes: string[];
}

export interface QualityInput {
  outputText: string;
  instruction?: string;
  requireCitations?: boolean;
  requireCode?: boolean;
  highRisk?: boolean;
  threshold?: number;
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function evaluateQuality(input: QualityInput): QualityReport {
  const text = input.outputText ?? "";
  const instruction = input.instruction ?? "";
  const notes: string[] = [];

  const dims: QualityDimensions = {
    correctness: 50,
    completeness: 50,
    instructionFollowing: 50,
    factualConsistency: 50,
    reasoningQuality: 50,
    codeQuality: 0,
    security: 60,
    formatCompliance: 50,
    citationQuality: 0,
    businessRelevance: 50,
  };

  if (text.length > 80) dims.completeness += 15;
  if (text.length > 400) dims.completeness += 10;
  if (text.length < 20) {
    dims.completeness -= 30;
    notes.push("Very short output");
  }

  if (instruction) {
    const tokens = instruction
      .toLowerCase()
      .split(/\W+/)
      .filter((t) => t.length > 4)
      .slice(0, 12);
    const hits = tokens.filter((t) => text.toLowerCase().includes(t)).length;
    dims.instructionFollowing = clamp(40 + (hits / Math.max(1, tokens.length)) * 60);
  } else {
    dims.instructionFollowing = 55;
  }

  if (/```[\s\S]*```/.test(text) || /\bfunction\b|\bconst\b|\bclass\b/.test(text)) {
    dims.codeQuality = 70;
    if (input.requireCode) dims.codeQuality += 10;
  } else if (input.requireCode) {
    dims.codeQuality = 20;
    notes.push("Code expected but not detected");
  }

  if (/\b(https?:\/\/|doi:|arxiv)/i.test(text) || /\[\d+\]/.test(text)) {
    dims.citationQuality = 75;
  } else if (input.requireCitations) {
    dims.citationQuality = 15;
    notes.push("Citations required but weak/absent");
  }

  if (/\b(TODO|FIXME|placeholder|lorem ipsum)\b/i.test(text)) {
    dims.completeness -= 25;
    dims.correctness -= 15;
    notes.push("Placeholder markers detected");
  }

  if (text.trim().length > 0) dims.formatCompliance = 70;
  if (/^#{1,3}\s|^\*\*|^\- /m.test(text)) dims.formatCompliance += 10;

  if (input.highRisk) {
    dims.security = 50;
    dims.factualConsistency = 45;
    notes.push("High-risk task: prefer multi-model verification");
  }

  dims.reasoningQuality = clamp(
    (dims.completeness + dims.instructionFollowing + dims.factualConsistency) / 3
  );
  dims.correctness = clamp((dims.instructionFollowing + dims.reasoningQuality) / 2);
  dims.businessRelevance = clamp((dims.completeness + dims.instructionFollowing) / 2);

  for (const k of Object.keys(dims) as (keyof QualityDimensions)[]) {
    dims[k] = clamp(dims[k]);
  }

  const weights: Array<[keyof QualityDimensions, number]> = [
    ["correctness", 0.15],
    ["completeness", 0.12],
    ["instructionFollowing", 0.15],
    ["factualConsistency", 0.12],
    ["reasoningQuality", 0.12],
    ["codeQuality", input.requireCode ? 0.1 : 0.02],
    ["security", input.highRisk ? 0.1 : 0.05],
    ["formatCompliance", 0.07],
    ["citationQuality", input.requireCitations ? 0.1 : 0.03],
    ["businessRelevance", 0.08],
  ];
  let wsum = 0;
  let score = 0;
  for (const [k, w] of weights) {
    score += dims[k] * w;
    wsum += w;
  }
  const qualityScore = clamp(score / wsum);
  const confidence = clamp(
    40 +
      (text.length > 100 ? 15 : 0) +
      (dims.citationQuality > 50 ? 10 : 0) -
      (input.highRisk ? 15 : 0)
  );

  const threshold = input.threshold ?? 70;
  const triggers: string[] = [];
  let recommendedAction: QualityReport["recommendedAction"] = "accept";

  if (qualityScore < threshold - 20) {
    recommendedAction = input.highRisk ? "escalate_human" : "switch_model";
    triggers.push("quality far below threshold");
  } else if (qualityScore < threshold) {
    recommendedAction = "increase_reasoning";
    triggers.push("quality below threshold");
  }
  if (input.highRisk && qualityScore < 85) {
    recommendedAction = "ensemble";
    triggers.push("high-risk requires stronger verification");
  }
  if (dims.citationQuality < 40 && input.requireCitations) {
    triggers.push("weak citations");
    if (recommendedAction === "accept") recommendedAction = "retry";
  }

  return {
    qualityScore,
    confidence,
    dimensions: dims,
    triggers,
    recommendedAction,
    notes,
  };
}

export function qualityGate(
  report: QualityReport,
  threshold = 70
): { passed: boolean; report: QualityReport } {
  return {
    passed: report.qualityScore >= threshold && report.recommendedAction === "accept",
    report,
  };
}
