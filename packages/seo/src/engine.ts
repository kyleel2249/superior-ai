/**
 * SEO Intelligence Engine
 * Never claims guaranteed rankings. Labels data provenance.
 */

import type { KeywordCluster, SeoAuditResult, DataProvenance } from "@superior-ai/core";

export function clusterKeywords(seed: string, industry?: string): KeywordCluster {
  const base = seed.toLowerCase().trim();
  return {
    pillar: base,
    keywords: [
      { term: base, intent: "commercial", volumeEstimate: undefined, difficulty: undefined },
      { term: `best ${base}`, intent: "commercial" },
      { term: `${base} for small business`, intent: "commercial" },
      { term: `how to ${base}`, intent: "informational" },
      { term: `${base} vs alternative`, intent: "comparison" },
      { term: `${base} pricing`, intent: "transactional" },
      { term: `${base} ${industry ?? "software"}`, intent: "commercial" },
    ],
    contentGaps: [
      `Comparison page: ${base} vs competitors`,
      `Use-case page for target vertical`,
      `Local / regional landing if relevant`,
      `FAQ addressing top objections`,
    ],
  };
}

export function planContentFactory(pillar: string): string[] {
  return [
    `Pillar page: Complete guide to ${pillar}`,
    `Cluster: How ${pillar} works`,
    `Cluster: ${pillar} for [persona]`,
    `Comparison: ${pillar} vs alternatives`,
    `Case study template`,
    `FAQ / knowledge base article`,
    `Landing page for primary offer`,
    `YouTube script: ${pillar} tutorial`,
    `LinkedIn thought-leadership outline`,
  ];
}

export function auditUrlPlaceholder(url: string): SeoAuditResult {
  // Real audit requires live fetch + tools; return structured shell with honest provenance
  return {
    url,
    seoScore: 0,
    uxScore: 0,
    conversionScore: 0,
    contentScore: 0,
    performanceScore: 0,
    accessibilityScore: 0,
    trustScore: 0,
    recommendations: [
      "Run live page fetch via browser tool to populate scores",
      "Extract title, meta, H1, schema, internal links",
      "Check Core Web Vitals when measurement available",
      "Map CTAs and trust elements",
    ],
    technicalSignals: { note: "Awaiting live crawl" },
    dataQuality: "Model Inference" as DataProvenance,
    confidence: 10,
  };
}

export function seoMetadata(title: string, description: string): { title: string; description: string; schemaHint: string } {
  return {
    title: title.slice(0, 60),
    description: description.slice(0, 155),
    schemaHint: "FAQPage | Product | Organization | Article as applicable",
  };
}
