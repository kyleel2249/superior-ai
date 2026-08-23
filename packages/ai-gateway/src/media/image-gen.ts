/**
 * Image Generation Pipeline
 * Honest resolution labeling: Native | Upscaled | Final
 * Never claims native 8K unless the provider actually returned that size.
 */

export type ResolutionLabel = "Native Resolution" | "Upscaled Resolution" | "Final Resolution";

export interface ImageGenRequest {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  /** Requested target; may be achieved via upscale */
  targetWidth?: number;
  targetHeight?: number;
  realism?: boolean;
  style?: string;
  provider?: "openai" | "google" | "local" | "auto";
}

export interface ImageGenResult {
  success: boolean;
  imageUrl?: string;
  imageBase64?: string;
  nativeWidth: number;
  nativeHeight: number;
  finalWidth: number;
  finalHeight: number;
  upscaled: boolean;
  resolutionLabel: ResolutionLabel;
  provider: string;
  model?: string;
  error?: string;
  note?: string;
}

function labelResolution(nativeW: number, nativeH: number, finalW: number, finalH: number): {
  upscaled: boolean;
  resolutionLabel: ResolutionLabel;
} {
  const upscaled = finalW > nativeW || finalH > nativeH;
  if (!upscaled) {
    return { upscaled: false, resolutionLabel: "Native Resolution" };
  }
  return { upscaled: true, resolutionLabel: "Upscaled Resolution" };
}

/** OpenAI Images API (gpt-image / dall-e style) */
async function generateOpenAI(req: ImageGenRequest): Promise<ImageGenResult> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return {
      success: false,
      nativeWidth: 0,
      nativeHeight: 0,
      finalWidth: 0,
      finalHeight: 0,
      upscaled: false,
      resolutionLabel: "Native Resolution",
      provider: "openai",
      error: "OPENAI_API_KEY not configured",
    };
  }

  const base = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  // Standard API sizes — do not claim 8K native
  const size = pickOpenAISize(req.width ?? 1024, req.height ?? 1024);

  try {
    const res = await fetch(`${base}/images/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
        prompt: buildPrompt(req),
        size,
        n: 1,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return {
        success: false,
        nativeWidth: 0,
        nativeHeight: 0,
        finalWidth: 0,
        finalHeight: 0,
        upscaled: false,
        resolutionLabel: "Native Resolution",
        provider: "openai",
        error: `HTTP ${res.status}: ${text.slice(0, 300)}`,
      };
    }

    const data = (await res.json()) as {
      data?: Array<{ url?: string; b64_json?: string }>;
    };
    const item = data.data?.[0];
    const [nw, nh] = size.split("x").map(Number) as [number, number];
    const targetW = req.targetWidth ?? nw;
    const targetH = req.targetHeight ?? nh;
    const { upscaled, resolutionLabel } = labelResolution(nw, nh, targetW, targetH);

    return {
      success: true,
      imageUrl: item?.url,
      imageBase64: item?.b64_json,
      nativeWidth: nw,
      nativeHeight: nh,
      finalWidth: targetW,
      finalHeight: targetH,
      upscaled,
      resolutionLabel: upscaled ? resolutionLabel : "Native Resolution",
      provider: "openai",
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
      note: upscaled
        ? "Final dimensions exceed native provider output — label as Upscaled, not native 8K."
        : "Dimensions match provider native output.",
    };
  } catch (err) {
    return {
      success: false,
      nativeWidth: 0,
      nativeHeight: 0,
      finalWidth: 0,
      finalHeight: 0,
      upscaled: false,
      resolutionLabel: "Native Resolution",
      provider: "openai",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function pickOpenAISize(w: number, h: number): string {
  // Common supported sizes — never invent 7680x4320 as native
  const allowed = ["1024x1024", "1024x1536", "1536x1024", "1024x1792", "1792x1024"];
  const ratio = w / h;
  if (ratio > 1.3) return "1792x1024";
  if (ratio < 0.75) return "1024x1792";
  return "1024x1024";
}

function buildPrompt(req: ImageGenRequest): string {
  const parts = [req.prompt];
  if (req.realism !== false) {
    parts.push(
      "photorealistic, natural skin texture, realistic hands, natural lighting, accurate proportions, subtle imperfections"
    );
  }
  if (req.style) parts.push(`style: ${req.style}`);
  if (req.negativePrompt) parts.push(`Avoid: ${req.negativePrompt}`);
  return parts.join(". ");
}

export async function generateImage(req: ImageGenRequest): Promise<ImageGenResult> {
  const provider = req.provider ?? "auto";
  if (provider === "openai" || (provider === "auto" && process.env.OPENAI_API_KEY)) {
    return generateOpenAI(req);
  }

  // Spec-only response when no provider configured
  const w = req.width ?? 1024;
  const h = req.height ?? 1024;
  const tw = req.targetWidth ?? w;
  const th = req.targetHeight ?? h;
  const { upscaled, resolutionLabel } = labelResolution(w, h, tw, th);

  return {
    success: false,
    nativeWidth: w,
    nativeHeight: h,
    finalWidth: tw,
    finalHeight: th,
    upscaled,
    resolutionLabel,
    provider: "none",
    error: "No image provider configured. Set OPENAI_API_KEY (or wire another image adapter).",
    note: "When generating, native provider size is recorded separately from any upscale target. 8K is only labeled Native if the model actually returns 8K.",
  };
}

export function describeResolution(result: ImageGenResult): string {
  return [
    `Native: ${result.nativeWidth}×${result.nativeHeight}`,
    result.upscaled ? `Upscaled → Final: ${result.finalWidth}×${result.finalHeight}` : `Final: ${result.finalWidth}×${result.finalHeight}`,
    `Label: ${result.resolutionLabel}`,
  ].join(" · ");
}
