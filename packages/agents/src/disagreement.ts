/**
 * Disagreement Engine
 * Real structural comparison of claims across council agents — not another
 * LLM prompt hoping consensus emerges. Agents submit structured claims
 * (subject + assertion + confidence + evidence refs); this module detects
 * genuine contradictions, ranks them by how much they matter, and either
 * resolves via evidence strength or marks for escalation. Never invents
 * evidence or confidence values that weren't provided.
 */

export interface AgentClaim {
  agentId: string;
  agentName: string;
  subject: string; // what the claim is about, used to group related claims
  assertion: string; // the actual claim
  confidence: number; // 0-100, agent-reported
  evidenceRefs: string[]; // citation IDs, tool result IDs, source URLs — not free text
}

export interface DisagreementGroup {
  subject: string;
  claims: AgentClaim[];
  severity: "low" | "medium" | "high";
}

export interface DisagreementResolution {
  subject: string;
  status: "resolved" | "escalated";
  winningClaim?: AgentClaim;
  reasoning: string;
  marginOfConfidence: number; // gap between top two claims' weighted score
}

export interface DisagreementReport {
  totalClaims: number;
  groups: DisagreementGroup[];
  resolutions: DisagreementResolution[];
  escalatedCount: number;
  note: string;
}

function normalizeSubject(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Two assertions on the same subject "disagree" if they're not near-identical text. */
function assertionsConflict(a: string, b: string): boolean {
  const na = a.trim().toLowerCase();
  const nb = b.trim().toLowerCase();
  if (na === nb) return false;
  // crude but honest: if one contains the other, treat as elaboration not conflict
  if (na.includes(nb) || nb.includes(na)) return false;
  return true;
}

export function groupClaimsBySubject(claims: AgentClaim[]): Map<string, AgentClaim[]> {
  const groups = new Map<string, AgentClaim[]>();
  for (const c of claims) {
    const key = normalizeSubject(c.subject);
    const list = groups.get(key) ?? [];
    list.push(c);
    groups.set(key, list);
  }
  return groups;
}

export function detectDisagreements(claims: AgentClaim[]): DisagreementGroup[] {
  const groups = groupClaimsBySubject(claims);
  const disagreements: DisagreementGroup[] = [];

  for (const [subject, group] of groups) {
    if (group.length < 2) continue; // need at least 2 agents to disagree

    let hasConflict = false;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        if (assertionsConflict(group[i].assertion, group[j].assertion)) {
          hasConflict = true;
          break;
        }
      }
      if (hasConflict) break;
    }
    if (!hasConflict) continue;

    // severity from confidence spread and evidence asymmetry, not invented
    const confidences = group.map((c) => c.confidence);
    const spread = Math.max(...confidences) - Math.min(...confidences);
    const evidenceCounts = group.map((c) => c.evidenceRefs.length);
    const anyUnsupported = evidenceCounts.some((n) => n === 0);

    const severity: DisagreementGroup["severity"] =
      spread < 15 && anyUnsupported ? "high" : spread < 30 ? "medium" : "low";

    disagreements.push({ subject, claims: group, severity });
  }

  return disagreements.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });
}

/**
 * Weighted score = confidence adjusted by evidence count. An unsupported
 * high-confidence claim is intentionally penalized rather than trusted.
 */
function weightedScore(claim: AgentClaim): number {
  const evidenceBonus = Math.min(claim.evidenceRefs.length * 8, 24);
  const unsupportedPenalty = claim.evidenceRefs.length === 0 ? 15 : 0;
  return claim.confidence + evidenceBonus - unsupportedPenalty;
}

const ESCALATION_MARGIN_THRESHOLD = 12;

export function resolveDisagreement(group: DisagreementGroup): DisagreementResolution {
  const scored = group.claims
    .map((c) => ({ claim: c, score: weightedScore(c) }))
    .sort((a, b) => b.score - a.score);

  const top = scored[0];
  const second = scored[1];
  const margin = second ? top.score - second.score : top.score;

  if (!second || margin >= ESCALATION_MARGIN_THRESHOLD) {
    return {
      subject: group.subject,
      status: "resolved",
      winningClaim: top.claim,
      reasoning: `${top.claim.agentName}'s claim scored highest (confidence ${top.claim.confidence}, ${top.claim.evidenceRefs.length} evidence refs) with a ${margin.toFixed(1)}-point margin over the next candidate — clear enough to resolve automatically.`,
      marginOfConfidence: margin,
    };
  }

  return {
    subject: group.subject,
    status: "escalated",
    reasoning: `Top two claims scored within ${margin.toFixed(1)} points of each other (threshold: ${ESCALATION_MARGIN_THRESHOLD}) — too close to resolve automatically. Requires human review or a targeted re-analysis with additional evidence.`,
    marginOfConfidence: margin,
  };
}

export function runDisagreementEngine(claims: AgentClaim[]): DisagreementReport {
  const groups = detectDisagreements(claims);
  const resolutions = groups.map(resolveDisagreement);
  const escalatedCount = resolutions.filter((r) => r.status === "escalated").length;

  return {
    totalClaims: claims.length,
    groups,
    resolutions,
    escalatedCount,
    note:
      groups.length === 0
        ? "No genuine disagreements detected across submitted claims."
        : `${groups.length} subject(s) had conflicting claims; ${resolutions.length - escalatedCount} resolved automatically, ${escalatedCount} escalated for human review.`,
  };
}
