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

/** Search intent classification */
export type SearchIntent =
  | "informational"
  | "navigational"
  | "commercial"
  | "transactional"
  | "comparison"
  | "local";

export function analyzeIntent(query: string): {
  query: string;
  primaryIntent: SearchIntent;
  secondary?: SearchIntent;
  rationale: string;
} {
  const q = query.toLowerCase();
  if (/\bvs\b|versus|alternative|compare/.test(q)) {
    return { query, primaryIntent: "comparison", rationale: "Comparison language detected" };
  }
  if (/buy|pricing|price|cost|demo|trial|signup|sign up/.test(q)) {
    return { query, primaryIntent: "transactional", secondary: "commercial", rationale: "Purchase / trial signals" };
  }
  if (/best|top|review|for (small business|teams|enterprise)/.test(q)) {
    return { query, primaryIntent: "commercial", rationale: "Evaluation language" };
  }
  if (/near me|in [a-z]+|local/.test(q)) {
    return { query, primaryIntent: "local", secondary: "commercial", rationale: "Geo modifiers" };
  }
  if (/login|official|website/.test(q)) {
    return { query, primaryIntent: "navigational", rationale: "Brand/navigation signals" };
  }
  return { query, primaryIntent: "informational", rationale: "Default how/what/why learning intent" };
}

export interface SeoBrief {
  topic: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  intent: SearchIntent;
  audience: string;
  angle: string;
  outline: Array<{ heading: string; level: 2 | 3; notes: string }>;
  internalLinkSuggestions: string[];
  metadata: { title: string; description: string; schemaHint: string };
  wordCountTarget: number;
  avoid: string[];
  humanWritingNotes: string[];
}

export function generateSeoBrief(input: {
  topic: string;
  audience?: string;
  industry?: string;
}): SeoBrief {
  const cluster = clusterKeywords(input.topic, input.industry);
  const intent = analyzeIntent(input.topic);
  const audience = input.audience ?? "practitioners evaluating solutions";
  const primary = cluster.keywords[0]?.term ?? input.topic;

  const outline: SeoBrief["outline"] = [
    { heading: `What ${primary} really means`, level: 2, notes: "Define in plain language; no jargon wall" },
    { heading: "Why it matters now", level: 2, notes: "Context + stakes for the reader" },
    { heading: "How it works (practical view)", level: 2, notes: "Steps or framework; examples" },
    { heading: "Common mistakes", level: 2, notes: "Honest pitfalls; builds trust" },
    { heading: `Choosing ${primary} for ${audience}`, level: 2, notes: "Decision criteria" },
    { heading: "FAQ", level: 2, notes: "3–5 real questions" },
    { heading: "Next step", level: 2, notes: "Soft CTA aligned to intent" },
  ];

  return {
    topic: input.topic,
    primaryKeyword: primary,
    secondaryKeywords: cluster.keywords.slice(1).map((k) => k.term),
    intent: intent.primaryIntent,
    audience,
    angle: `Help ${audience} understand ${primary} without hype`,
    outline,
    internalLinkSuggestions: [
      `/blog/${primary.replace(/\s+/g, "-")}-guide`,
      `/compare/${primary.replace(/\s+/g, "-")}-alternatives`,
      `/resources/faq`,
      `/product`,
    ],
    metadata: seoMetadata(
      `${primary}: A practical guide for ${audience}`.slice(0, 60),
      `Learn how ${primary} works, what to avoid, and how to choose — written for ${audience}.`.slice(0, 155)
    ),
    wordCountTarget: intent.primaryIntent === "informational" ? 1800 : 1200,
    avoid: [
      "Keyword stuffing",
      "Hollow superlatives without evidence",
      "Invented statistics",
      "Duplicate competitor copy",
    ],
    humanWritingNotes: [
      "Open with a concrete scene or problem, not a dictionary definition",
      "Prefer short paragraphs and varied sentence length",
      "Use 'you' carefully; stay specific to audience",
      "Cite only sources you actually have",
    ],
  };
}

/** Rank-ready article structure — content is a draft scaffold, not fabricated research claims */
export function generateArticleDraft(input: {
  topic: string;
  audience?: string;
  industry?: string;
}): {
  brief: SeoBrief;
  markdown: string;
  qualityChecks: string[];
} {
  const brief = generateSeoBrief(input);
  const sections = brief.outline
    .map((h) => {
      const tag = h.level === 2 ? "##" : "###";
      return `${tag} ${h.heading}\n\n${h.notes}\n\n*(Expand with verified examples, quotes, or data you can support.)*\n`;
    })
    .join("\n");

  const markdown = `# ${brief.metadata.title}

${brief.metadata.description}

${sections}

---

**Internal links to consider:** ${brief.internalLinkSuggestions.join(", ")}

**Schema hint:** ${brief.metadata.schemaHint}
`;

  return {
    brief,
    markdown,
    qualityChecks: [
      "Primary keyword appears in title and first section naturally",
      "Outline covers intent without stuffing secondary terms",
      "FAQ present for long-tail coverage",
      "No invented metrics or rankings claims",
      "CTA matches intent (informational → learn more; commercial → evaluate)",
    ],
  };
}

export function suggestSchema(pageType: "article" | "faq" | "product" | "organization"): object {
  if (pageType === "article") {
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "{{title}}",
      description: "{{description}}",
      author: { "@type": "Organization", name: "{{brand}}" },
    };
  }
  if (pageType === "faq") {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [],
    };
  }
  if (pageType === "product") {
    return {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "{{product}}",
      applicationCategory: "BusinessApplication",
    };
  }
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "{{brand}}",
  };
}

export function competitorContentGaps(
  seed: string,
  competitorTopics: string[] = []
): { seed: string; gaps: string[]; note: string } {
  const cluster = clusterKeywords(seed);
  const covered = new Set(competitorTopics.map((t) => t.toLowerCase()));
  const gaps = [
    ...cluster.contentGaps,
    ...cluster.keywords
      .map((k) => k.term)
      .filter((t) => !covered.has(t) && !covered.has(t.toLowerCase())),
  ];
  return {
    seed,
    gaps: [...new Set(gaps)],
    note: "Gaps are structural hypotheses. Validate with live SERP/crawl tools before prioritizing.",
  };
}
