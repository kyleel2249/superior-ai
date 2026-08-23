/**
 * Matches the call site in apps/web/src/app/api/images/route.ts exactly,
 * including its own disclaimer: "Native 8K is only claimed when the provider
 * returns 8K natively." That constraint drives the implementation below —
 * resolution is only ever reported from what the provider actually returned.
 */

export interface GenerateImageInput {
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

export interface GenerateImageResult {
  mediaProduced: boolean;
  provider?: string;
  url?: string;
  nativeWidth?: number;
  nativeHeight?: number;
  upscaled: boolean;
  message: string;
}

const DALLE_SIZES = ["1024x1024", "1792x1024", "1024x1792"] as const;

function nearestDalleSize(width?: number, height?: number): (typeof DALLE_SIZES)[number] {
  if (!width || !height) return "1024x1024";
  const ratio = width / height;
  if (ratio > 1.3) return "1792x1024";
  if (ratio < 0.77) return "1024x1792";
  return "1024x1024";
}

export async function generateImage(input: GenerateImageInput): Promise<GenerateImageResult> {
  const requestedProvider = input.provider && input.provider !== "auto" ? input.provider : "openai";

  if (requestedProvider === "openai") {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return { mediaProduced: false, upscaled: false, message: "OPENAI_API_KEY not configured — no image was generated." };
    }
    const size = nearestDalleSize(input.width, input.height);
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: input.negativePrompt ? `${input.prompt} (avoid: ${input.negativePrompt})` : input.prompt,
        size,
        n: 1,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { mediaProduced: false, provider: "openai", upscaled: false, message: `OpenAI image generation failed: ${res.status} ${text.slice(0, 300)}` };
    }
    const data = (await res.json()) as { data: Array<{ url?: string; revised_prompt?: string }> };
    const [w, h] = size.split("x").map(Number);
    return {
      mediaProduced: true,
      provider: "openai",
      url: data.data[0]?.url,
      nativeWidth: w,
      nativeHeight: h,
      upscaled: false,
      message: "Generated via OpenAI DALL-E 3 (native resolution, not upscaled).",
    };
  }

  return {
    mediaProduced: false,
    provider: requestedProvider,
    upscaled: false,
    message: `Image provider "${requestedProvider}" is not implemented yet — no request was sent.`,
  };
}

export function describeResolution(result: GenerateImageResult): string {
  if (!result.mediaProduced || !result.nativeWidth || !result.nativeHeight) {
    return `Not generated: ${result.message}`;
  }
  return `${result.nativeWidth}x${result.nativeHeight} ${result.upscaled ? "upscaled" : "native"} (${result.provider})`;
}
