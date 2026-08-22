/**
 * Ad Campaign Engine — one sentence → full campaign plan
 */

import type { Campaign, Platform, CreativeStyle } from "@superior-ai/core";
import { buildStoryBoard, platformDefaults } from "./story-director";
import { predictCreativePerformance, generateVariations } from "./performance";

export interface CampaignRequest {
  oneLiner: string;
  product: string;
  audience: string;
  region?: string;
  platforms?: Platform[];
}

export function createCampaignFromOneLiner(req: CampaignRequest): {
  campaign: Omit<Campaign, "id">;
  scripts: Array<{ angle: string; script: string }>;
  storyBoard: ReturnType<typeof buildStoryBoard>;
  predictions: ReturnType<typeof predictCreativePerformance>;
  checklist: string[];
} {
  const platforms = req.platforms ?? (["tiktok", "instagram", "linkedin", "youtube"] as Platform[]);
  const primary = platforms[0]!;
  const defaults = platformDefaults(primary);

  const storyBoard = buildStoryBoard({
    product: req.product,
    audience: req.audience,
    region: req.region,
    painPoint: "manual follow-ups and lost leads",
    offer: req.product,
    cta: "Start free trial / Book demo",
    durationSec: Math.min(30, defaults.maxSec),
    style: "ugc" as CreativeStyle,
    platform: primary,
    culturalContext: req.region,
  });

  const baseScript = `Hook: ${storyBoard.hook}. Conflict: ${storyBoard.conflict}. Solution: ${storyBoard.solution}. CTA: ${storyBoard.cta}`;
  const scripts = generateVariations(baseScript, 10);
  const predictions = predictCreativePerformance({ script: baseScript, style: "ugc" });

  return {
    campaign: {
      objective: req.oneLiner,
      audience: req.audience,
      icp: `${req.audience}${req.region ? ` in ${req.region}` : ""}`,
      offer: req.product,
      platforms,
      assets: [],
      status: "draft",
    },
    scripts,
    storyBoard,
    predictions,
    checklist: [
      "Define ICP and buyer personas",
      "Generate 10 hooks / headlines / CTAs",
      "Generate UGC + studio variants",
      "Create platform aspect ratios (9:16, 1:1, 16:9)",
      "Landing page + lead magnet",
      "SEO supporting content",
      "Email / CRM follow-up sequence",
      "Measurement plan (CTR, CPL, pipeline)",
      "Approval before publish",
    ],
  };
}
