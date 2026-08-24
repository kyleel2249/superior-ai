/**
 * Phase 4 requirement: Critic Agent. Compares every pair of successful
 * ensemble responses using token-overlap similarity (same technique already
 * used in packages/memory's lexical retrieval — no embedding model is
 * guaranteed to be configured, so this is honestly lexical, not semantic).
 * Flags "conflict" when responses diverge below a similarity threshold
 * rather than silently picking one.
 */
import type { EnsembleMember } from "./ensemble";

export interface PairwiseComparison {
  a: string;
  b: string;
  similarity: number;
}

export interface CritiqueResult {
  comparisons: PairwiseComparison[];
  averageSimilarity: number;
  conflict: boolean;
  outlierProviders: string[];
}

function tokenize(text: string): Set<string> {
  return new Set(text.toLowerCase().split(/[^a-z0-9]+/i).filter((t) => t.length > 2));
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

const CONFLICT_THRESHOLD = 0.15;

export function critiqueResponses(members: EnsembleMember[]): CritiqueResult {
  const succeeded = members.filter((m): m is EnsembleMember & { response: NonNullable<EnsembleMember["response"]> } => m.ok && Boolean(m.response));

  if (succeeded.length < 2) {
    return { comparisons: [], averageSimilarity: succeeded.length === 1 ? 1 : 0, conflict: false, outlierProviders: [] };
  }

  const tokenSets = succeeded.map((m) => tokenize(m.response.content));
  const comparisons: PairwiseComparison[] = [];
  for (let i = 0; i < succeeded.length; i++) {
    for (let j = i + 1; j < succeeded.length; j++) {
      comparisons.push({
        a: succeeded[i]!.provider,
        b: succeeded[j]!.provider,
        similarity: jaccardSimilarity(tokenSets[i]!, tokenSets[j]!),
      });
    }
  }

  const averageSimilarity = comparisons.reduce((sum, c) => sum + c.similarity, 0) / comparisons.length;

  // A provider is an "outlier" if its average similarity to every other response is below threshold.
  const outlierProviders = succeeded
    .filter((m) => {
      const related = comparisons.filter((c) => c.a === m.provider || c.b === m.provider);
      const avg = related.reduce((sum, c) => sum + c.similarity, 0) / related.length;
      return avg < CONFLICT_THRESHOLD;
    })
    .map((m) => m.provider);

  return {
    comparisons,
    averageSimilarity,
    conflict: averageSimilarity < CONFLICT_THRESHOLD || outlierProviders.length > 0,
    outlierProviders,
  };
}
