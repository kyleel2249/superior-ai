/**
 * Multi-document analysis and comparison.
 */

import type { DocumentParseResult } from "./types";
import { parseDocument } from "./parsers";

export interface DocCompareResult {
  documents: Array<{ filename?: string; kind: string; chars: number; confidence: number }>;
  sharedTerms: string[];
  uniqueByDoc: Record<string, string[]>;
  summary: string;
}

function terms(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/\W+/)
      .filter((t) => t.length > 3)
  );
}

export function compareDocuments(
  docs: Array<{ content?: string; buffer?: Buffer; filename?: string; mime?: string }>
): DocCompareResult {
  const parsed: DocumentParseResult[] = docs.map((d) => parseDocument(d));
  const termSets = parsed.map((p) => terms(p.text));
  const shared = new Set<string>();
  if (termSets.length >= 2) {
    for (const t of termSets[0]!) {
      if (termSets.every((s) => s.has(t))) shared.add(t);
    }
  }
  const uniqueByDoc: Record<string, string[]> = {};
  parsed.forEach((p, i) => {
    const name = p.filename ?? `doc_${i}`;
    const others = termSets.filter((_, j) => j !== i);
    uniqueByDoc[name] = [...termSets[i]!].filter((t) => others.every((o) => !o.has(t))).slice(0, 30);
  });

  return {
    documents: parsed.map((p) => ({
      filename: p.filename,
      kind: p.kind,
      chars: p.text.length,
      confidence: p.confidence,
    })),
    sharedTerms: [...shared].slice(0, 40),
    uniqueByDoc,
    summary: `Compared ${parsed.length} documents. Shared terms: ${[...shared].slice(0, 12).join(", ") || "none"}.`,
  };
}

export function multiDocumentAnalysis(
  docs: Array<{ content?: string; buffer?: Buffer; filename?: string }>
): {
  combinedText: string;
  perDoc: DocumentParseResult[];
  compare: DocCompareResult;
} {
  const perDoc = docs.map((d) => parseDocument(d));
  const combinedText = perDoc
    .map((p, i) => `--- Document ${i + 1}: ${p.filename ?? p.kind} ---\n${p.text}`)
    .join("\n\n");
  return {
    combinedText: combinedText.slice(0, 100_000),
    perDoc,
    compare: compareDocuments(docs),
  };
}
