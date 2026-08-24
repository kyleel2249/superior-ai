/**
 * Phase 4 requirement: Task Classifier. Feeds superior-router.ts's RouteInput
 * shape so classification and routing use the same vocabulary. Heuristic,
 * not ML-based — every signal here is a real, inspectable rule, not a
 * fabricated confidence score.
 */
import type { TaskType } from "@superior-ai/core";
import type { RouteInput } from "../router/superior-router";

const REASONING_KEYWORDS = ["prove", "why", "explain", "derive", "analyze", "compare", "evaluate", "trade-off", "tradeoff", "step by step", "reasoning"];
const CODE_KEYWORDS = ["function", "class ", "bug", "compile", "typescript", "python", "refactor", "stack trace", "npm", "regex"];
const IMAGE_KEYWORDS = ["image of", "picture of", "photo of", "generate an image", "draw", "illustration"];
const VIDEO_KEYWORDS = ["video of", "generate a video", "storyboard", "clip of"];
const HIGH_RISK_KEYWORDS = ["legal", "medical", "diagnosis", "financial advice", "contract", "compliance", "security vulnerability"];

export interface TaskClassification extends RouteInput {
  wordCount: number;
  hasQuestion: boolean;
  matchedReasoningSignals: string[];
}

function countMatches(text: string, keywords: string[]): string[] {
  const lower = text.toLowerCase();
  return keywords.filter((k) => lower.includes(k));
}

export function classifyTask(text: string): TaskClassification {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const hasQuestion = text.includes("?");
  const reasoningHits = countMatches(text, REASONING_KEYWORDS);
  const codeHits = countMatches(text, CODE_KEYWORDS);
  const imageHits = countMatches(text, IMAGE_KEYWORDS);
  const videoHits = countMatches(text, VIDEO_KEYWORDS);
  const riskHits = countMatches(text, HIGH_RISK_KEYWORDS);

  let taskType: TaskType = "chat";
  if (videoHits.length > 0) taskType = "video";
  else if (imageHits.length > 0) taskType = "image";
  else if (codeHits.length > 0) taskType = "code";

  // Difficulty 1-5: longer prompts + reasoning language + risk language push it up.
  let difficulty = 1;
  if (wordCount > 40) difficulty += 1;
  if (wordCount > 120) difficulty += 1;
  if (reasoningHits.length > 0) difficulty += 1;
  if (riskHits.length > 0) difficulty += 1;
  difficulty = Math.min(5, difficulty);

  const risk: RouteInput["risk"] = riskHits.length > 0 ? "high" : reasoningHits.length > 0 ? "medium" : "low";

  return {
    taskType,
    difficulty,
    risk,
    requiredReasoning: reasoningHits.length > 0 || difficulty >= 4,
    requiredTools: codeHits.length > 0 ? ["code_exec"] : [],
    requiredModality: taskType === "image" ? ["image"] : taskType === "video" ? ["video"] : ["text"],
    costSensitivity: wordCount < 20 ? "high" : "medium",
    latencySensitivity: wordCount < 20 ? "high" : "medium",
    privacyLevel: riskHits.length > 0 ? "elevated" : "standard",
    intelligenceLevel: difficulty >= 4 ? "REASONING" : difficulty >= 3 ? "POWERFUL" : difficulty <= 1 ? "FAST" : "BALANCED",
    wordCount,
    hasQuestion,
    matchedReasoningSignals: reasoningHits,
  };
}
