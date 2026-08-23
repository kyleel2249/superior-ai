import { NextRequest, NextResponse } from "next/server";
import { createCampaignFromOneLiner } from "@superior-ai/creative";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const oneLiner = String(body.objective ?? body.oneLiner ?? "").trim();
    if (!oneLiner) return NextResponse.json({ error: "objective required" }, { status: 400 });
    const result = createCampaignFromOneLiner({
      oneLiner,
      product: body.product ?? "product",
      audience: body.audience ?? "customers",
      region: body.region,
      platforms: body.platforms,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
