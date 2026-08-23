import type { StoryBoard } from "@superior-ai/creative";

/**
 * Matches apps/web/src/app/api/video/route.ts's own disclaimer verbatim:
 * "mediaProduced=false means no synthetic video URLs were invented." No
 * video generation provider (Runway/Pika/Sora/etc.) is wired up yet, so this
 * honestly returns mediaProduced:false rather than fabricating a URL.
 */

export interface ContinuityLockInput {
  characterName: string;
  productName: string;
  environment: string;
  brand?: string;
}

export interface ContinuityLock {
  characterName: string;
  productName: string;
  environment: string;
  brand?: string;
  lockId: string;
  descriptors: string[];
}

export function buildContinuityLock(input: ContinuityLockInput): ContinuityLock {
  return {
    characterName: input.characterName,
    productName: input.productName,
    environment: input.environment,
    brand: input.brand,
    lockId: `lock_${Buffer.from(`${input.characterName}|${input.productName}|${input.environment}`).toString("base64url").slice(0, 16)}`,
    descriptors: [
      `Same actor as "${input.characterName}" in every scene — no face/wardrobe swaps.`,
      `Product shown must be "${input.productName}" with consistent packaging/branding across scenes.`,
      `Setting stays "${input.environment}" unless the storyboard explicitly changes location.`,
      ...(input.brand ? [`Brand styling follows "${input.brand}" guidelines throughout.`] : []),
    ],
  };
}

export interface GenerateVideoInput {
  storyBoard: StoryBoard;
  platform: string;
  style: string;
  aspectRatio: string;
  continuity: ContinuityLock;
  provider?: string;
}

export interface GenerateVideoResult {
  mediaProduced: boolean;
  provider?: string;
  url?: string;
  message: string;
}

export async function generateVideo(input: GenerateVideoInput): Promise<GenerateVideoResult> {
  // TODO(phase 3+): wire a real provider (Runway ML, Pika, Sora API, etc.)
  // here. Until one is configured, refuse rather than fabricate a URL.
  return {
    mediaProduced: false,
    provider: input.provider,
    message: "No video generation provider is configured yet — no synthetic video URL was invented.",
  };
}
