/**
 * Red Team Agent
 * Challenges assumptions, surfaces attack vectors and failure modes to
 * investigate. Does not fabricate findings about the subject — it produces
 * a structured checklist of what to attack/verify, not invented results.
 */

export type RedTeamCategory =
  | "assumption"
  | "security"
  | "financial"
  | "evidence"
  | "failure_mode"
  | "code";

export interface RedTeamChallenge {
  id: string;
  category: RedTeamCategory;
  question: string;
  whyItMatters: string;
}

export interface RedTeamPlan {
  subject: string;
  challenges: RedTeamChallenge[];
  note: string;
}

function challenge(id: string, category: RedTeamCategory, question: string, whyItMatters: string): RedTeamChallenge {
  return { id, category, question, whyItMatters };
}

export function planRedTeam(subject: string): RedTeamPlan {
  const s = subject.trim() || "the proposal";

  const challenges: RedTeamChallenge[] = [
    challenge(
      "assumption-1",
      "assumption",
      `What does ${s} assume is true that hasn't actually been verified?`,
      "Unverified assumptions are the most common source of downstream failure."
    ),
    challenge(
      "assumption-2",
      "assumption",
      `What would have to be false for ${s} to fail?`,
      "Inverting the plan surfaces hidden dependencies."
    ),
    challenge(
      "evidence-1",
      "evidence",
      `What evidence supports ${s}, and how strong is the source?`,
      "Distinguishes verified claims from plausible-sounding ones."
    ),
    challenge(
      "evidence-2",
      "evidence",
      `Is there evidence that contradicts ${s}? Was it looked for, or just not found?`,
      "Absence of contradicting evidence isn't the same as having searched for it."
    ),
    challenge(
      "security-1",
      "security",
      `Where does ${s} handle untrusted input, and is it validated before use?`,
      "Most real vulnerabilities are at trust boundaries."
    ),
    challenge(
      "security-2",
      "security",
      `What happens if ${s} is used exactly as documented but by a hostile actor?`,
      "Legitimate interfaces are the most common attack surface."
    ),
    challenge(
      "financial-1",
      "financial",
      `What cost or revenue assumption in ${s} is most sensitive to being wrong?`,
      "Identifies which numbers most need independent verification."
    ),
    challenge(
      "failure-1",
      "failure_mode",
      `What is the most likely way ${s} fails in practice, not in theory?`,
      "Theoretical failure modes and practical ones are often different."
    ),
    challenge(
      "failure-2",
      "failure_mode",
      `If ${s} fails, is that failure detected quickly, or silently?`,
      "Silent failures compound; detected failures can be fixed."
    ),
    challenge(
      "code-1",
      "code",
      `If ${s} involves code: what's the worst input it could receive, and is that tested?`,
      "Edge cases, not the happy path, are where bugs live."
    ),
  ];

  return {
    subject: s,
    challenges,
    note: "These are questions to investigate, not findings — this planner does not analyze the subject's actual content, only generates what should be checked.",
  };
}
