import { NextRequest, NextResponse } from "next/server";
import { generateVideo, buildContinuityLock } from "@superior-ai/ai-gateway";
import { buildStoryBoard } from "@superior-ai/creative";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const product = String(body.product ?? "product");
    const audience = String(body.audience ?? "customers");
    const durationSec = Number(body.durationSec ?? 30);

    const storyBoard =
      body.storyBoard ??
      buildStoryBoard({
        product,
        audience,
        region: body.region,
        painPoint: body.painPoint ?? "manual follow-ups and lost leads",
        offer: product,
        cta: body.cta ?? "Book a demo",
        durationSec,
        style: body.style ?? "ugc",
        platform: body.platform ?? "tiktok",
      });

    const continuity = buildContinuityLock({
      characterName: body.characterName ?? "business owner",
      productName: product,
      environment: body.environment ?? "small office",
      brand: body.brand,
    });

    const result = await generateVideo({
      storyBoard,
      platform: body.platform ?? "tiktok",
      style: body.style ?? "ugc",
      aspectRatio: body.aspectRatio ?? "9:16",
      continuity,
      provider: body.provider ?? "auto",
    });

    return NextResponse.json({
      ...result,
      storyBoard,
      disclaimer: "mediaProduced=false means no synthetic video URLs were invented.",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
