/**
 * Creative Intelligence Engine — performance prediction (estimates only)
 */

import type { CreativePerformancePrediction, CreativeAsset } from "@superior-ai/core";

export function predictCreativePerformance(asset: Partial<CreativeAsset> & { script?: string; style?: string }): CreativePerformancePrediction {
  const script = (asset.script ?? "").toLowerCase();
  const hasHook = /^(stop|wait|imagine|what if|nobody|this is|day in)/.test(script) || script.length > 20;
  const hasCta = /try|start|book|get|join|learn|buy|sign up|demo/.test(script);
  const hasPain = /lose|miss|forget|struggle|waste|manual|chaos|overwhelm/.test(script);
  const ugc = asset.style === "ugc" || asset.style === "social_native";

  const hookStrength = hasHook ? 72 : 48;
  const attention = ugc ? 70 : 58;
  const clarity = script.length > 40 && script.length < 400 ? 75 : 55;
  const emotion = hasPain ? 74 : 50;
  const relevance = 65;
  const brandFit = 70;
  const offer = hasCta ? 68 : 45;
  const ctaStrength = hasCta ? 72 : 40;
  const visual = 60;
  const purchase = Math.round((offer + ctaStrength + emotion) / 3);

  const avg =
    (hookStrength + attention + clarity + emotion + relevance + brandFit + offer + ctaStrength + visual + purchase) / 10;

  return {
    hookStrength,
    attentionPotential: attention,
    messageClarity: clarity,
    emotionalAppeal: emotion,
    audienceRelevance: relevance,
    brandFit,
    offerStrength: offer,
    ctaStrength,
    visualQuality: visual,
    purchaseIntent: purchase,
    predictedCtr: Math.round(avg * 0.04 * 10) / 10, // rough heuristic %
    predictedEngagement: Math.round(avg * 0.08 * 10) / 10,
    predictedConversion: Math.round(avg * 0.015 * 100) / 100,
    creativeConfidence: Math.min(85, Math.round(avg)),
    disclaimer: "Estimates only — not guaranteed performance",
  };
}

export function generateVariations(baseScript: string, count = 10): Array<{ angle: string; script: string }> {
  const angles = [
    "Pain-focused",
    "Outcome-focused",
    "Curiosity-focused",
    "Social-proof-focused",
    "Fear-of-loss-focused",
    "Founder-story",
    "Day-in-the-life",
    "Before/After",
    "Humor-skit",
    "Expert-authority",
  ];
  return angles.slice(0, count).map((angle) => ({
    angle,
    script: `[${angle}] ${baseScript}`,
  }));
}
