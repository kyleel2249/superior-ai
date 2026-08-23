/**
 * Image/video generation are NOT wired to a live provider yet.
 * Per the "no invented tool results" rule in docs/ARCHITECTURE.md,
 * these honestly report NOT_CONFIGURED instead of returning a fake
 * image/video URL. Wiring OpenRouter's image endpoints (or a
 * dedicated provider) here is a separate follow-up.
 */

export interface ImageGenInput {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  targetWidth?: number;
  targetHeight?: number;
  realism?: boolean;
  style?: string;
  provider?: string;
}

export interface ImageGenResult {
  success: false;
  status: "NOT_CONFIGURED";
  message: string;
  requestedWidth?: number;
  requestedHeight?: number;
}

export function describeResolution(result: ImageGenResult): string {
  const w = result.requestedWidth ?? result.requestedHeight;
  if (!w) return "unknown resolution — no provider configured, nothing was generated";
  return `${result.requestedWidth}x${result.requestedHeight} requested — not generated (${result.message})`;
}

export async function generateImage(input: ImageGenInput): Promise<ImageGenResult> {
  return {
    success: false,
    status: "NOT_CONFIGURED",
    message: "Image generation has no configured provider yet.",
    requestedWidth: input.targetWidth ?? input.width,
    requestedHeight: input.targetHeight ?? input.height,
  };
}

export interface VideoGenResult {
  ok: false;
  status: "NOT_CONFIGURED";
  mediaProduced: false;
  message: string;
}

export function buildContinuityLock(input: {
  characterName: string;
  productName: string;
  environment: string;
  brand?: string;
}): { characterName: string; productName: string; environment: string; brand?: string; lockId: string } {
  return { ...input, lockId: `lock_${Date.now()}` };
}

export async function generateVideo(_input: unknown): Promise<VideoGenResult> {
  return {
    ok: false,
    status: "NOT_CONFIGURED",
    mediaProduced: false,
    message: "Video generation has no configured provider yet.",
  };
}
