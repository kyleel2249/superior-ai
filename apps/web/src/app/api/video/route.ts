import { NextRequest, NextResponse } from "next/server";
import { generateVideo, buildContinuityLock } from "@superior-ai/ai-gateway";
import {
  buildStoryBoard,
  planCinematicProduction,
  extendStory,
  buildTimelineFromScenes,
  planClipStitch,
} from "@superior-ai/creative";

export async function GET() {
  return NextResponse.json({
    actions: ["generate", "cinematic", "timeline", "stitch", "extend"],
    note: "Never invents video URLs. Continuity + timeline planned offline.",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action ?? "generate");

    const brief = {
      product: String(body.product ?? "product"),
      audience: String(body.audience ?? "customers"),
      region: body.region,
      painPoint: body.painPoint ?? "manual follow-ups and lost leads",
      offer: String(body.offer ?? body.product ?? "product"),
      cta: body.cta ?? "Book a demo",
      durationSec: Number(body.durationSec ?? 30),
      style: body.style ?? "ugc",
      platform: body.platform ?? "tiktok",
      culturalContext: body.culturalContext,
    };

    if (action === "cinematic") {
      return NextResponse.json(planCinematicProduction(brief));
    }

    if (action === "timeline") {
      const board = body.storyBoard ?? buildStoryBoard(brief);
      const timeline = buildTimelineFromScenes({
        name: `${brief.product} timeline`,
        aspectRatio: body.aspectRatio ?? "9:16",
        scenes: board.scenes,
        captions: body.captions,
        voiceover: body.voiceover,
      });
      return NextResponse.json({ timeline, storyBoard: board });
    }

    if (action === "stitch") {
      const clips = Array.isArray(body.clips) ? body.clips : [];
      return NextResponse.json(planClipStitch(clips));
    }

    if (action === "extend") {
      const base = planCinematicProduction(brief);
      const extended = extendStory(base, {
        description: String(body.sceneDescription ?? "Continued scene with same character and product"),
        durationSec: body.durationSec,
        emotion: body.emotion,
      });
      return NextResponse.json(extended);
    }

    const storyBoard = body.storyBoard ?? buildStoryBoard(brief);
    const continuity = buildContinuityLock({
      characterName: body.characterName ?? "business owner",
      productName: brief.product,
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

    const timeline = buildTimelineFromScenes({
      name: `${brief.product} timeline`,
      aspectRatio: body.aspectRatio ?? "9:16",
      scenes: storyBoard.scenes,
    });

    return NextResponse.json({
      ...result,
      storyBoard,
      timeline,
      disclaimer: "mediaProduced=false means no synthetic video URLs were invented.",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
