import { NextRequest, NextResponse } from "next/server";
import { buildStoryBoard, type VideoPlatform, type VideoStyle } from "@superior-ai/creative";

/**
 * /api/campaigns — plans a marketing campaign (storyboard + targeting) using
 * the same creative engine /api/video already depends on, but stops short of
 * generating media. Kept separate from /api/video because a "campaign" is a
 * plan the user can review/approve before any generation cost is spent —
 * generation itself is a follow-up call to /api/video with this storyboard.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.objective || !body.product) {
      return NextResponse.json({ error: "objective and product are required" }, { status: 400 });
    }
    const product = String(body.product);
    const audience = String(body.audience ?? "target customers");
    const storyBoard = buildStoryBoard({
      product,
      audience,
      region: body.region,
      painPoint: body.painPoint ?? "manual, slow, or inconsistent processes",
      offer: body.offer ?? product,
      cta: body.cta ?? "Book a demo",
      durationSec: Number(body.durationSec ?? 30),
      style: (body.style ?? "ugc") as VideoStyle,
      platform: (body.platform ?? "tiktok") as VideoPlatform,
    });
    return NextResponse.json({
      objective: String(body.objective),
      product,
      audience,
      storyBoard,
      nextStep: "POST /api/video with this storyBoard to attempt media generation.",
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
