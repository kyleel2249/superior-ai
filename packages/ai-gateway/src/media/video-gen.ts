/**
 * Video Generation + Continuity Engine
 * Maintains character / product / environment continuity keys across scenes.
 * Does not claim footage exists until a provider actually returns it.
 */

import type { StoryBoard, VideoScene, CreativeStyle, Platform } from "@superior-ai/core";

export interface ContinuityLock {
  characterId?: string;
  wardrobeId?: string;
  productId?: string;
  environmentId?: string;
  voiceId?: string;
  brandId?: string;
}

export interface VideoGenRequest {
  storyBoard: StoryBoard;
  platform: Platform;
  style: CreativeStyle;
  aspectRatio: "9:16" | "16:9" | "1:1" | "4:5";
  continuity: ContinuityLock;
  provider?: "openai" | "google" | "local" | "auto";
}

export interface SceneRenderResult {
  sceneId: string;
  order: number;
  status: "planned" | "rendered" | "failed" | "provider_required";
  durationSec: number;
  continuityApplied: string[];
  assetUrl?: string;
  error?: string;
}

export interface VideoGenResult {
  success: boolean;
  status: "planned" | "partial" | "complete" | "provider_required";
  scenes: SceneRenderResult[];
  continuity: ContinuityLock;
  totalDurationSec: number;
  provider: string;
  note: string;
  /** True only when real media bytes/URLs were produced */
  mediaProduced: boolean;
}

function continuityKeysForScene(scene: VideoScene, lock: ContinuityLock): string[] {
  const applied: string[] = [];
  for (const key of scene.continuityKeys) {
    if (key.includes("character") && lock.characterId) applied.push(`character:${lock.characterId}`);
    if (key.includes("product") && lock.productId) applied.push(`product:${lock.productId}`);
    if (key.includes("environment") && lock.environmentId) applied.push(`environment:${lock.environmentId}`);
    if (key.includes("wardrobe") && lock.wardrobeId) applied.push(`wardrobe:${lock.wardrobeId}`);
    if (key.includes("brand") && lock.brandId) applied.push(`brand:${lock.brandId}`);
  }
  return applied;
}

/**
 * Plan (and optionally render) each scene with continuity enforcement.
 * Without a video provider API key, returns a structured plan — never fakes media URLs.
 */
export async function generateVideo(req: VideoGenRequest): Promise<VideoGenResult> {
  const hasProvider =
    (req.provider === "openai" && !!process.env.OPENAI_API_KEY) ||
    (req.provider === "google" && !!process.env.GOOGLE_AI_API_KEY) ||
    (req.provider === "auto" && (!!process.env.OPENAI_API_KEY || !!process.env.GOOGLE_AI_API_KEY)) ||
    (req.provider === "local" && !!process.env.LOCAL_VIDEO_URL);

  const scenes: SceneRenderResult[] = req.storyBoard.scenes.map((scene) => {
    const continuityApplied = continuityKeysForScene(scene, req.continuity);
    if (!hasProvider) {
      return {
        sceneId: scene.id,
        order: scene.order,
        status: "provider_required" as const,
        durationSec: scene.durationSec,
        continuityApplied,
        error: "No video generation provider configured",
      };
    }
    // Provider adapters for actual video APIs plug in here.
    // Until an official video endpoint is validated, we plan only.
    return {
      sceneId: scene.id,
      order: scene.order,
      status: "planned" as const,
      durationSec: scene.durationSec,
      continuityApplied,
    };
  });

  const totalDurationSec = scenes.reduce((s, x) => s + x.durationSec, 0);
  const allPlanned = scenes.every((s) => s.status === "planned" || s.status === "provider_required");

  return {
    success: true,
    status: hasProvider ? (allPlanned ? "planned" : "partial") : "provider_required",
    scenes,
    continuity: req.continuity,
    totalDurationSec,
    provider: hasProvider ? req.provider ?? "auto" : "none",
    mediaProduced: false,
    note: hasProvider
      ? "Scene plan + continuity locks ready. Wire validated video API to set mediaProduced=true and asset URLs."
      : "Configure a supported video provider. Continuity locks and storyboard are prepared without inventing media.",
  };
}

export function buildContinuityLock(input: {
  characterName?: string;
  productName?: string;
  environment?: string;
  brand?: string;
}): ContinuityLock {
  const slug = (s: string) => s.toLowerCase().replace(/\W+/g, "_").slice(0, 32);
  return {
    characterId: input.characterName ? `char_${slug(input.characterName)}` : undefined,
    productId: input.productName ? `prod_${slug(input.productName)}` : undefined,
    environmentId: input.environment ? `env_${slug(input.environment)}` : undefined,
    brandId: input.brand ? `brand_${slug(input.brand)}` : undefined,
  };
}
