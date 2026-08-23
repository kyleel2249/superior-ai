import { NextRequest, NextResponse } from "next/server";
import { publishPost, listSocialStatus, type SocialPlatform } from "@superior-ai/social";

export async function GET() {
  return NextResponse.json({
    platforms: listSocialStatus(),
    note: "Only official platform APIs. Tokens via env or BYOK. No ToS bypass.",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Require explicit approval flag for publish
    if (body.approved !== true) {
      return NextResponse.json(
        {
          error: "Set approved:true to publish. Drafts and previews do not need this flag.",
          draft: { platform: body.platform, text: body.text, mediaUrls: body.mediaUrls },
        },
        { status: 400 }
      );
    }
    const result = await publishPost({
      platform: body.platform as SocialPlatform,
      text: String(body.text ?? ""),
      mediaUrls: body.mediaUrls,
      scheduledAt: body.scheduledAt,
      accessToken: body.accessToken,
    });
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
