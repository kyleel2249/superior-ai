/**
 * Phase 4 requirement: Synthesis Agent. Combines ensemble members + the
 * critic's verdict into one final answer. Never silently discards a
 * conflicting response — if the critic found disagreement, the synthesis
 * says so explicitly rather than picking one model's answer and hiding
 * that others disagreed.
 */
import type { EnsembleMember } from "./ensemble";
import type { CritiqueResult } from "./critic";

export interface SynthesisResult {
  finalText: string;
  strategy: "single_success" | "consensus" | "conflict_disclosed" | "all_failed";
  contributingProviders: string[];
}

export function synthesizeResponses(members: EnsembleMember[], critique: CritiqueResult): SynthesisResult {
  const succeeded = members.filter((m): m is EnsembleMember & { response: NonNullable<EnsembleMember["response"]> } => m.ok && Boolean(m.response));

  if (succeeded.length === 0) {
    const errors = members.map((m) => `${m.provider}: ${m.error ?? "unknown error"}`).join("; ");
    return { finalText: `All providers failed. ${errors}`, strategy: "all_failed", contributingProviders: [] };
  }

  if (succeeded.length === 1) {
    return { finalText: succeeded[0]!.response.content, strategy: "single_success", contributingProviders: [succeeded[0]!.provider] };
  }

  if (!critique.conflict) {
    // Consensus: pick the fullest response as representative, but note it reflects agreement across N models.
    const fullest = [...succeeded].sort((a, b) => b.response.content.length - a.response.content.length)[0]!;
    return {
      finalText: fullest.response.content,
      strategy: "consensus",
      contributingProviders: succeeded.map((m) => m.provider),
    };
  }

  // Conflict: disclose every response rather than silently choosing one.
  const sections = succeeded.map((m) => `**${m.provider}:**\n${m.response.content}`).join("\n\n---\n\n");
  const outlierNote = critique.outlierProviders.length > 0 ? `\n\n(Notably divergent: ${critique.outlierProviders.join(", ")}.)` : "";
  return {
    finalText: `Models disagreed (similarity ${(critique.averageSimilarity * 100).toFixed(0)}%). Showing all responses rather than picking one silently:\n\n${sections}${outlierNote}`,
    strategy: "conflict_disclosed",
    contributingProviders: succeeded.map((m) => m.provider),
  };
}
