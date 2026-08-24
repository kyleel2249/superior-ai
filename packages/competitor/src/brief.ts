/**
 * Structured competitive comparisons + executive brief.
 * Public signals only; empty fields stay empty — never invent metrics.
 */

import type { CompetitorProfile } from "@superior-ai/core";
import { comparisonTemplate } from "./intelligence";

export interface DimensionRow {
  dimension: string;
  us: string;
  them: Record<string, string>;
  gap: string;
}

export interface CompetitiveBrief {
  ourProduct: string;
  competitorNames: string[];
  executiveSummary: string;
  dimensions: DimensionRow[];
  whereTheyWin: string[];
  whereWeWin: string[];
  weaknesses: string[];
  opportunities: string[];
  testsToRun: string[];
  narrativeComparisons: string[];
  provenance: string;
}

export function buildFeatureComparison(
  ourProduct: string,
  competitors: CompetitorProfile[],
  ourFeatures: string[] = []
): DimensionRow[] {
  const dims = [
    "Core product",
    "Pricing transparency",
    "Onboarding",
    "Integrations",
    "Mobile",
    "Support",
    "SEO content depth",
    "Social proof",
  ];
  return dims.map((dimension) => {
    const them: Record<string, string> = {};
    for (const c of competitors) {
      if (dimension === "Core product") {
        them[c.name] = c.products.length ? c.products.join(", ") : "Unknown (public)";
      } else if (dimension === "Pricing transparency") {
        them[c.name] = c.pricingSignals.length
          ? c.pricingSignals.join("; ")
          : "Not observed publicly";
      } else if (dimension === "SEO content depth") {
        them[c.name] = c.contentTopics.length
          ? `${c.contentTopics.length} topics observed`
          : "Pending crawl";
      } else if (dimension === "Social proof") {
        them[c.name] = Object.keys(c.socialPresence || {}).length
          ? JSON.stringify(c.socialPresence)
          : "Not observed";
      } else {
        them[c.name] = c.positioning || "Not observed";
      }
    }
    return {
      dimension,
      us:
        dimension === "Core product" && ourFeatures.length
          ? ourFeatures.join(", ")
          : `${ourProduct} — fill from product fact sheet`,
      them,
      gap: "Validate with live site review before strategy decisions",
    };
  });
}

export function generateCompetitiveBrief(input: {
  ourProduct: string;
  competitors: CompetitorProfile[];
  ourFeatures?: string[];
  ourPositioning?: string;
}): CompetitiveBrief {
  const names = input.competitors.map((c) => c.name);
  const dimensions = buildFeatureComparison(
    input.ourProduct,
    input.competitors,
    input.ourFeatures
  );

  const whereTheyWin: string[] = [];
  const whereWeWin: string[] = [];
  const weaknesses: string[] = [];
  const opportunities: string[] = [];

  for (const c of input.competitors) {
    whereTheyWin.push(...c.strengths.map((s) => `${c.name}: ${s}`));
    weaknesses.push(...c.weaknesses.map((w) => `${c.name}: ${w}`));
    if (c.positioning) {
      whereTheyWin.push(`${c.name} positioning signal: ${c.positioning.slice(0, 120)}`);
    }
  }

  if (input.ourPositioning) {
    whereWeWin.push(`Our positioning: ${input.ourPositioning}`);
  }
  whereWeWin.push("Own narrative control in channels we publish");
  opportunities.push(
    "Content topics competitors omit",
    "Clearer pricing or packaging if competitors are opaque",
    "Faster onboarding claims only if operationally true",
    "Segment-specific landing pages underserved in their SEO"
  );

  const testsToRun = [
    "Message test: our differentiation vs their primary claim",
    "Landing page test on top competitor keyword cluster",
    "Pricing page clarity A/B (if applicable)",
    "Review-site presence gap audit (public pages only)",
  ];

  const narrativeComparisons = input.competitors.map((c) =>
    comparisonTemplate(input.ourProduct, c.name)
  );

  const executiveSummary = [
    `Competitive brief for ${input.ourProduct} vs ${names.join(", ") || "named set"}.`,
    `Profiles: ${input.competitors.length}. Observed strengths listed only when present on profiles.`,
    `Traffic, revenue, and private contacts are never invented.`,
    `Next: validate gaps with live crawl/SERP and fill product fact sheet for "us" columns.`,
  ].join(" ");

  return {
    ourProduct: input.ourProduct,
    competitorNames: names,
    executiveSummary,
    dimensions,
    whereTheyWin: whereTheyWin.length ? whereTheyWin : ["None recorded — research pending"],
    whereWeWin,
    weaknesses: weaknesses.length ? weaknesses : ["None recorded on profiles"],
    opportunities,
    testsToRun,
    narrativeComparisons,
    provenance:
      "Observed Data when research populated profiles; otherwise shells. Model Inference only for opportunity hypotheses, labeled as such.",
  };
}

export function messagingComparison(
  ourMessage: string,
  competitorMessages: Array<{ name: string; message: string }>
): Array<{ name: string; theirMessage: string; contrast: string }> {
  return competitorMessages.map((c) => ({
    name: c.name,
    theirMessage: c.message,
    contrast: `Ours emphasizes: ${ourMessage.slice(0, 160)} · Theirs emphasizes: ${c.message.slice(0, 160)}`,
  }));
}
