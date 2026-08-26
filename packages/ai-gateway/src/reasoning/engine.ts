/**
 * SUPERIOR / CINTEXA Reasoning Engine
 * Extended Thinking is a control — not a model.
 */

export type ReasoningLevel =
  | "NONE"
  | "MINIMAL"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "VERY_HIGH"
  | "XHIGH"
  | "MAXIMUM";

export type UserReasoningMode = "Auto" | "Fast" | "Balanced" | "Deep" | "Expert" | "Maximum" | "Custom";

const SCALE: Record<ReasoningLevel, number> = {
  NONE: 0,
  MINIMAL: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  VERY_HIGH: 4,
  XHIGH: 4,
  MAXIMUM: 5,
};

export function reasoningToScale(level: ReasoningLevel): number {
  return SCALE[level] ?? 2;
}

export function userModeToReasoning(mode: UserReasoningMode): ReasoningLevel {
  switch (mode) {
    case "Fast":
      return "LOW";
    case "Balanced":
      return "MEDIUM";
    case "Deep":
      return "HIGH";
    case "Expert":
      return "XHIGH";
    case "Maximum":
      return "MAXIMUM";
    case "Auto":
    default:
      return "MEDIUM";
  }
}

export function mapReasoningToProvider(
  level: ReasoningLevel,
  underlying: string
): Record<string, unknown> {
  const n = reasoningToScale(level);
  const u = underlying.toLowerCase();
  if (u.includes("openai") || u.includes("gpt")) {
    const map = ["none", "low", "medium", "high", "xhigh", "max"] as const;
    return { reasoning_effort: map[Math.min(5, n)] };
  }
  if (u.includes("google") || u.includes("gemini")) {
    const map = ["none", "low", "medium", "high", "high", "high"] as const;
    return { thinking_level: map[Math.min(5, n)] };
  }
  if (u.includes("anthropic") || u.includes("claude")) {
    return { extended_thinking: n >= 3, budget_tokens: n >= 4 ? 16000 : n >= 3 ? 8000 : 0 };
  }
  if (u.includes("xai") || u.includes("grok")) {
    return { reasoning_level: n >= 4 ? "high" : n >= 2 ? "medium" : "low" };
  }
  return { reasoning_level: level };
}
