import { NextRequest, NextResponse } from "next/server";
import {
  generateImage,
  describeResolution,
  editImage,
  listImageEditOps,
} from "@superior-ai/ai-gateway";

export async function GET() {
  return NextResponse.json({
    editOps: listImageEditOps(),
    note: "POST action=generate | edit. Honest resolution labels; no fake image URLs.",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action ?? "generate");

    if (action === "edit") {
      const result = await editImage({
        op: body.op ?? "inpaint",
        imageBase64: body.imageBase64,
        prompt: body.prompt,
        maskBase64: body.maskBase64,
        scale: body.scale,
        provider: body.provider,
      });
      return NextResponse.json(result);
    }

    const prompt = String(body.prompt ?? "").trim();
    if (!prompt) return NextResponse.json({ error: "prompt required" }, { status: 400 });

    const result = await generateImage({
      prompt,
      negativePrompt: body.negativePrompt,
      width: body.width,
      height: body.height,
      targetWidth: body.targetWidth,
      targetHeight: body.targetHeight,
      realism: body.realism !== false,
      style: body.style,
      provider: body.provider,
    });

    return NextResponse.json({
      ...result,
      resolutionSummary: describeResolution(result),
      disclaimer:
        "Resolution labels are technical facts. Native 8K is only claimed when the provider returns 8K natively.",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
