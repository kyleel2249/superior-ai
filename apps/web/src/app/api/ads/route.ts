import { NextRequest, NextResponse } from "next/server";
import {
  generateHooks,
  generateCtas,
  generateAdVariant,
  generateAdSkit,
  generateAdCampaignCreative,
  createCampaignFromOneLiner,
  type StoryType,
  type AdDurationSec,
} from "@superior-ai/creative";

export async function GET() {
  return NextResponse.json({
    storyTypes: [
      "problem",
      "customer",
      "founder",
      "transformation",
      "humorous",
      "educational",
      "emotional",
    ],
    durations: [10, 15, 20, 30, 45, 60, 90],
    actions: ["hooks", "ctas", "variant", "skit", "campaign", "full"],
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action ?? "campaign");
    const product = String(body.product ?? "Product");
    const audience = String(body.audience ?? "customers");
    const storyType = (body.storyType ?? "problem") as StoryType;

    if (action === "hooks") {
      return NextResponse.json(generateHooks(storyType, product, audience));
    }
    if (action === "ctas") {
      return NextResponse.json(generateCtas(product));
    }
    if (action === "variant") {
      return NextResponse.json(
        generateAdVariant({
          product,
          audience,
          storyType,
          durationSec: (Number(body.durationSec ?? 30) as AdDurationSec) || 30,
          hook: body.hook,
          cta: body.cta,
          painPoint: body.painPoint,
        })
      );
    }
    if (action === "skit") {
      return NextResponse.json(generateAdSkit({ product, audience, storyType }));
    }
    if (action === "full" || action === "one_liner") {
      const oneLiner = String(body.oneLiner ?? body.objective ?? `${product} for ${audience}`);
      const campaign = createCampaignFromOneLiner({
        oneLiner,
        product,
        audience,
        region: body.region,
        platforms: body.platforms,
      });
      const creative = generateAdCampaignCreative({
        product,
        audience,
        storyType,
        painPoint: body.painPoint,
        durations: body.durations,
      });
      return NextResponse.json({ ...campaign, creative });
    }

    // default campaign creative pack
    return NextResponse.json(
      generateAdCampaignCreative({
        product,
        audience,
        storyType,
        painPoint: body.painPoint,
        durations: body.durations,
      })
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
