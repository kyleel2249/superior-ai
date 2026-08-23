/**
 * Autonomous Growth Engine + Experiment generator
 */

import type { GrowthExperiment } from "@superior-ai/core";

export function proposeExperiments(context: string): GrowthExperiment[] {
  const base = context.slice(0, 80) || "conversion";
  return [
    {
      id: `exp_headline_${Date.now()}`,
      hypothesis: `A clearer pain-focused headline will increase landing conversion for ${base}`,
      metric: "Landing page CVR",
      variants: [
        { name: "A", description: "Pain-focused headline" },
        { name: "B", description: "Outcome-focused headline" },
        { name: "C", description: "Social-proof headline" },
      ],
      status: "proposed",
    },
    {
      id: `exp_ugc_${Date.now()}`,
      hypothesis: "UGC-style creative will outperform studio ads on short-form platforms",
      metric: "CTR",
      variants: [
        { name: "A", description: "Studio commercial" },
        { name: "B", description: "UGC phone-native" },
      ],
      status: "proposed",
    },
    {
      id: `exp_cta_${Date.now()}`,
      hypothesis: "Lower-friction CTA (Book demo → Start free) increases qualified starts",
      metric: "SQL rate",
      variants: [
        { name: "A", description: "Book demo" },
        { name: "B", description: "Start free" },
      ],
      status: "proposed",
    },
    {
      id: `exp_seo_${Date.now()}`,
      hypothesis: "Comparison page targets high-intent queries and lifts organic demos",
      metric: "Organic demo requests",
      variants: [{ name: "A", description: "Publish comparison cluster" }],
      status: "proposed",
    },
  ];
}

export function growthOpportunities(): string[] {
  return [
    "Increase traffic: SEO clusters + short-form distribution",
    "Increase leads: stronger lead magnet + LP test",
    "Increase conversion: offer clarity + social proof density",
    "Increase retention: onboarding checklist automation",
    "Increase AOV: packaged upsell after activation",
    "Lower CAC: organic + referral loops before paid scale",
  ];
}
