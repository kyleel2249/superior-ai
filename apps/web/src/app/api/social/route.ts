import { NextRequest, NextResponse } from "next/server";
import {
  publishPost,
  listSocialStatus,
  enqueuePost,
  listQueue,
  approveQueueItem,
  publishQueueItem,
  cancelQueueItem,
  batchEnqueue,
  type SocialPlatform,
} from "@superior-ai/social";
import { audit } from "@superior-ai/audit";

export async function GET(req: NextRequest) {
  const view = req.nextUrl.searchParams.get("view");
  if (view === "queue") {
    return NextResponse.json({ queue: listQueue() });
  }
  return NextResponse.json({
    platforms: listSocialStatus(),
    note: "Only official platform APIs. Tokens via env or BYOK. approved:true required to publish. No ToS bypass.",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action ?? "publish");

    if (action === "enqueue") {
      const item = enqueuePost({
        platform: body.platform as SocialPlatform,
        text: String(body.text ?? ""),
        mediaUrls: body.mediaUrls,
        scheduledAt: body.scheduledAt,
        requestApproval: body.requestApproval !== false,
      });
      return NextResponse.json(item, { status: 201 });
    }

    if (action === "batch_enqueue") {
      const platforms = (Array.isArray(body.platforms) ? body.platforms : ["linkedin", "x"]) as SocialPlatform[];
      const items = batchEnqueue(String(body.text ?? ""), platforms, body.mediaUrls);
      return NextResponse.json({ items }, { status: 201 });
    }

    if (action === "approve") {
      const item = approveQueueItem(String(body.id));
      if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });
      return NextResponse.json(item);
    }

    if (action === "publish_queue") {
      const item = await publishQueueItem(String(body.id), body.accessToken);
      if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });
      await audit({
        action: "social.publish",
        outcome: item.status === "published" ? "success" : "failure",
        resourceType: "social_queue",
        resourceId: item.id,
        meta: { platform: item.platform, status: item.status },
      }).catch(() => undefined);
      return NextResponse.json(item);
    }

    if (action === "cancel") {
      const item = cancelQueueItem(String(body.id));
      if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });
      return NextResponse.json(item);
    }

    // Direct publish — requires approved:true
    if (body.approved !== true) {
      return NextResponse.json(
        {
          error: "Set approved:true to publish. Use action=enqueue for draft/approval flow.",
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

    await audit({
      action: "social.publish",
      outcome: result.success ? "success" : "failure",
      resourceType: "social",
      meta: { platform: result.platform, status: result.status },
    }).catch(() => undefined);

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
