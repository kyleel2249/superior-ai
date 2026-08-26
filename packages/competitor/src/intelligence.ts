/**
 * Competitor Intelligence Engine
 * Public data only. Never fabricate traffic numbers or contacts.
 */

import type { CompetitorProfile, CompetitorScorecard, DataProvenance } from "@superior-ai/core";
export type { CompetitorProfile };

export function emptyCompetitor(name: string, website: string): CompetitorProfile {
  return {
    id: `comp_${name.toLowerCase().replace(/\W+/g, "_")}`,
    name,
    website,
    products: [],
    pricingSignals: [],
    positioning: "",
    strengths: [],
    weaknesses: [],
    seoKeywords: [],
    contentTopics: [],
    socialPresence: {},
    lastResearchedAt: new Date().toISOString(),
  };
}

export function buildScorecard(competitors: CompetitorProfile[]): CompetitorScorecard {
  return {
    competitors,
    opportunityMap: [
      "Content gaps where competitors rank and we do not",
      "Underserved segments in reviews",
      "Weak competitor CTAs or onboarding",
    ],
    threatMap: [
      "Competitors with strong brand search",
      "Aggressive content velocity",
      "Superior social proof density",
    ],
    seoGap: ["Pending live SERP and site crawl"],
    contentGap: ["Pending topic extraction from competitor blogs"],
    offerGap: ["Pending public pricing and packaging comparison"],
    positioningGap: ["Pending messaging comparison"],
  };
}

export function trafficIntelligenceShell(domain: string): {
  domain: string;
  sources: Record<string, string>;
  provenance: DataProvenance;
  confidence: number;
  note: string;
} {
  return {
    domain,
    sources: {
      organic: "Unknown until third-party or observed data",
      direct: "Unknown",
      referral: "Unknown",
      social: "Unknown",
      paid: "Unknown",
    },
    provenance: "Model Inference",
    confidence: 5,
    note: "Never fabricate traffic numbers. Integrate approved data providers or observed analytics only.",
  };
}

export function comparisonTemplate(ours: string, theirs: string): string {
  return [
    `## ${ours} vs ${theirs}`,
    "WHERE THEY WIN:",
    "WHERE WE WIN:",
    "WHERE THEY ARE WEAK:",
    "WHERE WE ARE WEAK:",
    "WHAT THEY ARE DOING THAT WE ARE NOT:",
    "WHAT WE SHOULD TEST:",
    "",
    "Data provenance must be labeled on every claim.",
  ].join("\n");
}
