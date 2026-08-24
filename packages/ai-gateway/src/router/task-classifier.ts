/**
 * Task classifier — maps free-text + optional hints to RoutingRequest.
 */

import type { IntelligenceLevel, RoutingRequest, TaskType } from "@superior-ai/core";

const TASK_PATTERNS: Array<{ type: TaskType; re: RegExp; difficulty?: number }> = [
  { type: "coding", re: /\b(code|implement|debug|refactor|typescript|python|api|bug|compile|test suite)\b/i, difficulty: 3 },
  { type: "research", re: /\b(research|search|sources?|cite|competitor|market size|literature)\b/i, difficulty: 3 },
  { type: "financial", re: /\b(revenue|margin|valuation|forecast|budget|p&l|roi|pricing)\b/i, difficulty: 4 },
  { type: "strategy", re: /\b(strategy|roadmap|go-to-market|positioning|okrs?|prioritiz)\b/i, difficulty: 4 },
  { type: "creative", re: /\b(ad|ugc|storyboard|campaign|brand|logo|copy|script|tagline)\b/i, difficulty: 2 },
  { type: "multimodal", re: /\b(image|video|audio|screenshot|transcribe|vision)\b/i, difficulty: 3 },
  { type: "document", re: /\b(pdf|docx|spreadsheet|xlsx|summarize document|extract table)\b/i, difficulty: 2 },
  { type: "deployment", re: /\b(deploy|kubernetes|ci\/cd|rollback|production release)\b/i, difficulty: 4 },
  { type: "automation", re: /\b(automat|workflow|schedule|orchestrat|agent team)\b/i, difficulty: 3 },
  { type: "analysis", re: /\b(analy[sz]e|compare|scorecard|metrics|diagnose)\b/i, difficulty: 3 },
];

export function classifyTask(
  text: string,
  overrides?: Partial<RoutingRequest> & { intelligenceLevel?: IntelligenceLevel }
): RoutingRequest {
  const lower = text.toLowerCase();
  let taskType: TaskType = "chat";
  let difficulty: 1 | 2 | 3 | 4 | 5 = 2;

  for (const p of TASK_PATTERNS) {
    if (p.re.test(text)) {
      taskType = p.type;
      difficulty = (p.difficulty ?? 3) as 1 | 2 | 3 | 4 | 5;
      break;
    }
  }

  const risk: RoutingRequest["risk"] =
    /\b(production|security|legal|pii|payment|critical)\b/i.test(text)
      ? "high"
      : /\b(important|customer-facing)\b/i.test(text)
        ? "medium"
        : "low";

  const requiredTools: string[] = [];
  if (/\b(search|research|url|web)\b/i.test(text)) requiredTools.push("web_search");
  if (/\b(code|repo|terminal|test)\b/i.test(text)) requiredTools.push("code_exec");
  if (/\b(browser|scrape|page)\b/i.test(text)) requiredTools.push("browser");

  const modality: RoutingRequest["requiredModality"] = ["text"];
  if (/\b(image|screenshot|logo)\b/i.test(text)) modality.push("image");
  if (/\b(video|ugc|ad clip)\b/i.test(text)) modality.push("video");
  if (/\b(code|implement)\b/i.test(text)) modality.push("code");

  let intelligenceLevel: IntelligenceLevel = overrides?.intelligenceLevel ?? "BALANCED";
  if (/\b\/supreme\b|\bsupreme mode\b/i.test(text)) intelligenceLevel = "SUPREME";
  if (/\b\/autonomous\b|\bautonomous mode\b/i.test(text)) intelligenceLevel = "AUTONOMOUS";
  if (/\bmaximum intelligence\b/i.test(text)) intelligenceLevel = "MAXIMUM";

  const base: RoutingRequest = {
    taskType,
    difficulty,
    risk,
    requiredReasoning: difficulty >= 3 || taskType === "strategy" || taskType === "financial",
    requiredTools,
    requiredModality: modality,
    costSensitivity: intelligenceLevel === "FAST" ? "high" : "medium",
    latencySensitivity: intelligenceLevel === "FAST" ? "high" : "medium",
    privacyLevel: /\b(private|confidential|internal only)\b/i.test(text) ? "elevated" : "standard",
    intelligenceLevel,
    contextTokensEstimate: Math.min(32_000, Math.max(1_000, lower.length * 2)),
  };

  return { ...base, ...overrides, taskType: overrides?.taskType ?? base.taskType };
}
