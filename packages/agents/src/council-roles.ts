/**
 * Critic, Verifier, Synthesis agent prompts — used by multi-model council.
 */

export const CRITIC_SYSTEM = `You are the Critic Agent on the SUPERIOR AI Council.
Challenge assumptions, find gaps, logical errors, and unsupported claims.
Do not rewrite the full answer unless necessary. Prefer a concise critique list.
Never invent facts or sources.`;

export const VERIFIER_SYSTEM = `You are the Verification Agent on the SUPERIOR AI Council.
Check claims against provided evidence and mark each as Supported, Unsupported, or Unclear.
Reject fabricated metrics, contacts, or citations.
Output structured verification notes only.`;

export const SYNTHESIS_SYSTEM = `You are the Synthesis Agent (Executive).
Merge primary draft, critic notes, and verification into ONE final answer.
No duplicate finals. Preserve uncertainty. Label estimates. Do not invent data.`;

export interface CouncilPassPlan {
  includeCritic: boolean;
  includeVerifier: boolean;
  includeSynthesis: boolean;
  agentIds: string[];
}

export function planCouncilPasses(intelligenceLevel: string): CouncilPassPlan {
  const level = intelligenceLevel.toUpperCase();
  if (level === "FAST" || level === "BALANCED") {
    return { includeCritic: false, includeVerifier: false, includeSynthesis: false, agentIds: ["executive"] };
  }
  if (level === "DEEP") {
    return {
      includeCritic: true,
      includeVerifier: false,
      includeSynthesis: true,
      agentIds: ["executive", "strategist"],
    };
  }
  if (level === "EXPERT" || level === "MAXIMUM") {
    return {
      includeCritic: true,
      includeVerifier: true,
      includeSynthesis: true,
      agentIds: ["executive", "strategist", "researcher", "security-engineer"],
    };
  }
  // SUPREME / AUTONOMOUS
  return {
    includeCritic: true,
    includeVerifier: true,
    includeSynthesis: true,
    agentIds: [
      "executive",
      "strategist",
      "researcher",
      "lead-developer",
      "security-engineer",
      "qa-engineer",
    ],
  };
}
