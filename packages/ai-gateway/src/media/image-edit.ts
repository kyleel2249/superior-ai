/**
 * Image editing operations — provider adapters.
 * Without official edit APIs, returns CONFIGURATION_REQUIRED (no fake output images).
 */

export type ImageEditOp =
  | "object_removal"
  | "object_replacement"
  | "generative_fill"
  | "upscale"
  | "super_resolution"
  | "retouch"
  | "composite"
  | "background_replace"
  | "inpaint"
  | "outpaint";

export interface ImageEditRequest {
  op: ImageEditOp;
  /** base64 source image optional */
  imageBase64?: string;
  prompt?: string;
  maskBase64?: string;
  scale?: number;
  provider?: "openai" | "auto";
}

export interface ImageEditResult {
  success: boolean;
  op: ImageEditOp;
  imageBase64?: string;
  imageUrl?: string;
  provider: string;
  status: "OK" | "CONFIGURATION_REQUIRED" | "ERROR" | "UNSUPPORTED";
  note?: string;
  error?: string;
}

export async function editImage(req: ImageEditRequest): Promise<ImageEditResult> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return {
      success: false,
      op: req.op,
      provider: "none",
      status: "CONFIGURATION_REQUIRED",
      error: "OPENAI_API_KEY (or other image-edit provider) not configured",
      note: "Adapters registered for removal, fill, upscale, retouch, composite. No fabricated image URLs.",
    };
  }

  // OpenAI images edit endpoint when image provided
  if (!req.imageBase64 && req.op !== "upscale") {
    return {
      success: false,
      op: req.op,
      provider: "openai",
      status: "ERROR",
      error: "imageBase64 required for edit operations",
    };
  }

  if (req.op === "upscale" || req.op === "super_resolution") {
    return {
      success: false,
      op: req.op,
      provider: "openai",
      status: "UNSUPPORTED",
      note: "True super-resolution requires a dedicated upscale model/API. Do not label as Native 8K after client-side stretch.",
      error: "Upscale provider not wired — configure a real SR endpoint",
    };
  }

  // Placeholder for images/edits when multipart is available in route layer
  return {
    success: false,
    op: req.op,
    provider: "openai",
    status: "CONFIGURATION_REQUIRED",
    note: `Operation ${req.op} adapter ready. Wire multipart /images/edits with mask when deploying with file uploads.`,
    error: "JSON-only path cannot send binary mask/image to provider; use upload-enabled route",
  };
}

export function listImageEditOps(): Array<{ op: ImageEditOp; description: string }> {
  return [
    { op: "object_removal", description: "Remove object given mask" },
    { op: "object_replacement", description: "Replace region with prompt" },
    { op: "generative_fill", description: "Fill masked region" },
    { op: "upscale", description: "Increase resolution via SR model" },
    { op: "super_resolution", description: "Dedicated SR pipeline" },
    { op: "retouch", description: "Cosmetic cleanup" },
    { op: "composite", description: "Layer composite" },
    { op: "background_replace", description: "Swap background" },
    { op: "inpaint", description: "Inpaint holes" },
    { op: "outpaint", description: "Extend canvas" },
  ];
}
