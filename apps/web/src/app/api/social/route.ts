import { NextRequest, NextResponse } from "next/server";
import { publishPost, listSocialStatus, type SocialPlatform } from "@superior-ai/social";

export async function GET() {
  return NextResponse.json({ platforms: listSocialStatus(), note: "Official platform APIs only. No ToS bypass." });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.approved !== true) {
      return NextResponse.json({
        error: "Set approved:true to publish.",
        draft: { platform: body.platform, text: body.text, mediaUrls: body.mediaUrls },
      }, { status: 400 });
    }
    const result = await publishPost({
      platform: body.platform as SocialPlatform,
      text: String(body.text ?? ""),
      mediaUrls: body.mediaUrls,
      accessToken: body.accessToken,
    });
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
