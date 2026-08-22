/**
 * Story Director Agent — story-driven video generation
 * Defines objectives, scenes, continuity, emotion, and CTA.
 */

import type { StoryBoard, VideoScene, CreativeStyle, Platform, AspectRatio } from "@superior-ai/core";

export interface StoryBrief {
  product: string;
  audience: string;
  region?: string;
  painPoint: string;
  offer: string;
  cta: string;
  durationSec: number;
  style: CreativeStyle;
  platform: Platform;
  culturalContext?: string;
}

export function buildStoryBoard(brief: StoryBrief): StoryBoard {
  const sceneDuration = Math.max(3, Math.floor(brief.durationSec / 5));
  const scenes: VideoScene[] = [
    {
      id: "hook",
      order: 1,
      description: `Hook: relatable moment of ${brief.painPoint} for ${brief.audience}`,
      durationSec: Math.min(5, sceneDuration),
      emotion: "frustration_recognition",
      continuityKeys: ["character_primary", "environment_daily"],
      cameraMovement: "handheld_close",
    },
    {
      id: "conflict",
      order: 2,
      description: `Conflict: consequence of unresolved ${brief.painPoint}`,
      durationSec: sceneDuration,
      emotion: "tension",
      continuityKeys: ["character_primary", "environment_daily"],
      productPlacement: false,
    },
    {
      id: "solution",
      order: 3,
      description: `Solution: ${brief.product} addresses the pain naturally`,
      durationSec: sceneDuration,
      emotion: "relief",
      continuityKeys: ["character_primary", "product"],
      productPlacement: true,
    },
    {
      id: "proof",
      order: 4,
      description: "Social proof or outcome (more follow-ups, more sales, less chaos)",
      durationSec: sceneDuration,
      emotion: "confidence",
      continuityKeys: ["character_primary", "product"],
      productPlacement: true,
    },
    {
      id: "cta",
      order: 5,
      description: `Clear CTA: ${brief.cta}`,
      durationSec: Math.min(5, sceneDuration),
      emotion: "action",
      continuityKeys: ["product", "brand"],
      productPlacement: true,
    },
  ];

  return {
    objective: `Convert ${brief.audience} by showing ${brief.painPoint} → ${brief.product}`,
    characterObjective: "Be believed as a real person facing a real problem",
    audienceEmotion: "I feel seen; this solves my problem",
    visualObjective: brief.style === "ugc" ? "Phone-native authenticity" : "Clear commercial storytelling",
    salesObjective: brief.cta,
    hook: scenes[0]!.description,
    scenes,
    conflict: brief.painPoint,
    solution: brief.product,
    socialProof: "Optional testimonial or outcome metric if user-provided",
    cta: brief.cta,
    ending: "Brand lockup + CTA screen",
  };
}

export function platformDefaults(platform: Platform): { aspect: AspectRatio; maxSec: number; pacing: string } {
  switch (platform) {
    case "tiktok":
    case "instagram":
      return { aspect: "9:16", maxSec: 30, pacing: "fast_hook" };
    case "youtube":
      return { aspect: "16:9", maxSec: 60, pacing: "demo_friendly" };
    case "linkedin":
      return { aspect: "1:1", maxSec: 45, pacing: "professional" };
    case "facebook":
      return { aspect: "4:5", maxSec: 30, pacing: "ugc_or_carousel" };
    default:
      return { aspect: "16:9", maxSec: 30, pacing: "balanced" };
  }
}

export function ugcAuthenticityHints(style: CreativeStyle): string[] {
  if (style !== "ugc" && style !== "customer_testimonial" && style !== "social_native") {
    return ["Studio-grade polish acceptable"];
  }
  return [
    "Phone-camera look",
    "Handheld micro-motion",
    "Natural pauses and speech",
    "Casual clothing",
    "Natural room lighting",
    "Minor imperfections allowed",
    "Conversational tone",
    "Avoid over-polished beauty filters",
  ];
}
