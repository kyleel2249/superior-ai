/**
 * Multimodal analysis adapters — honest status when provider APIs are missing.
 */

import type { DocumentKind, MultimodalAnalysisResult } from "./types";
import { detectKind } from "./detect";

export async function analyzeImage(input: {
  filename?: string;
  mime?: string;
  /** base64 without data: prefix optional */
  base64?: string;
  prompt?: string;
}): Promise<MultimodalAnalysisResult> {
  const hasVisionKey =
    Boolean(process.env.OPENAI_API_KEY) ||
    Boolean(process.env.OPENROUTER_API_KEY) ||
    Boolean(process.env.GOOGLE_AI_API_KEY) ||
    Boolean(process.env.XAI_API_KEY);

  if (!hasVisionKey) {
    return {
      kind: "image",
      summary: "Image analysis requires a vision-capable provider API key.",
      confidence: 0,
      providerStatus: "CONFIGURATION_REQUIRED",
      warnings: [
        "Set OPENAI_API_KEY, OPENROUTER_API_KEY, GOOGLE_AI_API_KEY, or XAI_API_KEY for vision.",
      ],
    };
  }

  // Best-effort OpenAI-compatible vision chat if key present
  const key = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY || "";
  const usingOr = Boolean(process.env.OPENROUTER_API_KEY) && !process.env.OPENAI_API_KEY;
  const base =
    process.env.OPENAI_BASE_URL ||
    (usingOr ? process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1" : "https://api.openai.com/v1");
  const model =
    process.env.VISION_MODEL ||
    (usingOr ? "openai/gpt-4o-mini" : "gpt-4o-mini");

  if (!input.base64) {
    return {
      kind: "image",
      summary: "No image payload provided.",
      confidence: 0,
      providerStatus: "ADAPTER",
      warnings: ["Provide base64 image data."],
    };
  }

  try {
    const mime = input.mime || "image/png";
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...(usingOr
          ? {
              "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
              "X-Title": "SUPERIOR AI",
            }
          : {}),
      },
      body: JSON.stringify({
        model,
        max_tokens: 800,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  input.prompt ||
                  "Describe this image. Extract any visible text (OCR). List key objects. Be factual.",
              },
              {
                type: "image_url",
                image_url: { url: `data:${mime};base64,${input.base64}` },
              },
            ],
          },
        ],
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      return {
        kind: "image",
        summary: `Vision provider error: HTTP ${res.status}`,
        confidence: 0,
        providerStatus: "ADAPTER",
        warnings: [errText.slice(0, 300)],
      };
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content ?? "";
    return {
      kind: "image",
      summary: content.slice(0, 4000),
      textDetected: content,
      confidence: 0.75,
      providerStatus: "local",
      warnings: [],
    };
  } catch (err) {
    return {
      kind: "image",
      summary: "Vision request failed",
      confidence: 0,
      providerStatus: "ADAPTER",
      warnings: [err instanceof Error ? err.message : String(err)],
    };
  }
}

export async function transcribeAudio(input: {
  filename?: string;
  note?: string;
}): Promise<MultimodalAnalysisResult> {
  // Whisper-compatible endpoint when configured
  const key = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
  if (!key) {
    return {
      kind: "audio",
      summary: "Audio transcription requires a speech-to-text provider.",
      confidence: 0,
      providerStatus: "CONFIGURATION_REQUIRED",
      warnings: [
        "Configure OPENAI_API_KEY (Whisper) or another ASR connector. Speaker segmentation requires diarization-capable API.",
      ],
    };
  }
  return {
    kind: "audio",
    summary:
      "ASR adapter registered. Upload binary via multipart endpoint when wiring file storage; binary STT not executed in this JSON-only path.",
    confidence: 0.2,
    providerStatus: "ADAPTER",
    warnings: [
      input.note || "Pass audio file through storage + multipart transcription route for full STT.",
    ],
    speakers: [],
  };
}

export async function analyzeVideo(input: {
  filename?: string;
  note?: string;
}): Promise<MultimodalAnalysisResult> {
  return {
    kind: "video",
    summary:
      "Video analysis adapter registered. Frame sampling + transcription requires media pipeline and provider APIs.",
    confidence: 0.15,
    providerStatus: "ADAPTER",
    warnings: [
      "Configure vision + ASR providers for full video understanding.",
      input.note || "No fabricated transcript or captions.",
    ],
    durationSec: undefined,
    transcript: undefined,
  };
}

export async function analyzeMultimodal(input: {
  filename?: string;
  mime?: string;
  base64?: string;
  content?: string;
}): Promise<MultimodalAnalysisResult> {
  const kind = detectKind(input.filename, input.mime);
  if (kind === "image") return analyzeImage(input);
  if (kind === "audio") return transcribeAudio({ filename: input.filename });
  if (kind === "video") return analyzeVideo({ filename: input.filename });
  return {
    kind: kind as DocumentKind,
    summary: "Not a multimodal media type — use parseDocument.",
    confidence: 0,
    providerStatus: "local",
    warnings: [`Detected kind: ${kind}`],
  };
}
