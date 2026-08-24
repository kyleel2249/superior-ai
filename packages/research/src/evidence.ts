/**
 * Evidence engine — structures findings with provenance labels.
 */

import type { SourceRef } from "./citations";

export type EvidenceLabel = "Observed" | "Estimated" | "Inferred" | "Unsupported";

export interface EvidenceItem {
  statement: string;
  label: EvidenceLabel;
  sourceIds: string[];
  confidence: number;
}

export function buildEvidence(
  statements: Array<{ text: string; sourceIds?: string[] }>,
  sources: SourceRef[]
): EvidenceItem[] {
  const known = new Set(sources.map((s) => s.id));
  return statements.map((s) => {
    const ids = (s.sourceIds ?? []).filter((id) => known.has(id));
    if (ids.length > 0) {
      return {
        statement: s.text,
        label: "Observed" as const,
        sourceIds: ids,
        confidence: Math.min(0.95, 0.5 + ids.length * 0.15),
      };
    }
    return {
      statement: s.text,
      label: "Unsupported" as const,
      sourceIds: [],
      confidence: 0.1,
    };
  });
}

export function evidenceReport(items: EvidenceItem[]): string {
  const lines = items.map((e) => {
    const src = e.sourceIds.length ? ` [${e.sourceIds.join(", ")}]` : "";
    return `• (${e.label}, conf=${e.confidence.toFixed(2)})${src} ${e.statement}`;
  });
  return lines.join("\n");
}
