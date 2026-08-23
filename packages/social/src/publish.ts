/**
 * Social publish — official platform APIs only
 * Never bypasses platform ToS or auth.
 */

export type SocialPlatform = "linkedin" | "x" | "facebook" | "instagram" | "youtube" | "tiktok" | "pinterest";

export interface PublishRequest {
  platform: SocialPlatform;
  text: string;
  mediaUrls?: string[];
  scheduledAt?: string;
  accessToken?: string;
}

export interface PublishResult {
  success: boolean;
  platform: SocialPlatform;
  status: "published" | "scheduled" | "draft" | "CONFIGURATION_REQUIRED" | "failed";
  externalId?: string;
  error?: string;
  note?: string;
}

function tokenFor(platform: SocialPlatform, override?: string): string | undefined {
  if (override) return override;
  const map: Record<SocialPlatform, string | undefined> = {
    linkedin: process.env.LINKEDIN_ACCESS_TOKEN,
    x: process.env.X_ACCESS_TOKEN || process.env.TWITTER_ACCESS_TOKEN,
    facebook: process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
    instagram: process.env.INSTAGRAM_ACCESS_TOKEN,
    youtube: process.env.YOUTUBE_ACCESS_TOKEN,
    tiktok: process.env.TIKTOK_ACCESS_TOKEN,
    pinterest: process.env.PINTEREST_ACCESS_TOKEN,
  };
  return map[platform];
}

export async function publishPost(req: PublishRequest): Promise<PublishResult> {
  const token = tokenFor(req.platform, req.accessToken);
  if (!token) {
    return {
      success: false,
      platform: req.platform,
      status: "CONFIGURATION_REQUIRED",
      error: `${req.platform} access token not configured`,
      note: "Connect official OAuth credentials. SUPERIOR AI does not bypass platform APIs.",
    };
  }

  // Platform-specific official API calls
  try {
    switch (req.platform) {
      case "linkedin": {
        // LinkedIn UGC post requires person/org URN — return structured requirement if incomplete
        if (!process.env.LINKEDIN_AUTHOR_URN) {
          return {
            success: false,
            platform: "linkedin",
            status: "CONFIGURATION_REQUIRED",
            error: "LINKEDIN_AUTHOR_URN required (urn:li:person:… or organization)",
          };
        }
        const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
          },
          body: JSON.stringify({
            author: process.env.LINKEDIN_AUTHOR_URN,
            lifecycleState: "PUBLISHED",
            specificContent: {
              "com.linkedin.ugc.ShareContent": {
                shareCommentary: { text: req.text },
                shareMediaCategory: "NONE",
              },
            },
            visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
          }),
        });
        if (!res.ok) {
          return {
            success: false,
            platform: "linkedin",
            status: "failed",
            error: `LinkedIn HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`,
          };
        }
        const id = res.headers.get("x-restli-id") ?? undefined;
        return { success: true, platform: "linkedin", status: "published", externalId: id };
      }
      case "x": {
        const res = await fetch("https://api.twitter.com/2/tweets", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: req.text.slice(0, 280) }),
        });
        if (!res.ok) {
          return {
            success: false,
            platform: "x",
            status: "failed",
            error: `X HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`,
          };
        }
        const data = (await res.json()) as { data?: { id?: string } };
        return { success: true, platform: "x", status: "published", externalId: data.data?.id };
      }
      case "facebook": {
        const pageId = process.env.FACEBOOK_PAGE_ID;
        if (!pageId) {
          return {
            success: false,
            platform: "facebook",
            status: "CONFIGURATION_REQUIRED",
            error: "FACEBOOK_PAGE_ID required with PAGE_ACCESS_TOKEN",
          };
        }
        const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: req.text, access_token: token }),
        });
        if (!res.ok) {
          return { success: false, platform: "facebook", status: "failed", error: `Facebook HTTP ${res.status}` };
        }
        const data = (await res.json()) as { id?: string };
        return { success: true, platform: "facebook", status: "published", externalId: data.id };
      }
      case "instagram": {
        // Instagram Content Publishing API requires Facebook Page linked IG Business account
        const igUserId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
        if (!igUserId) {
          return {
            success: false,
            platform: "instagram",
            status: "CONFIGURATION_REQUIRED",
            error: "INSTAGRAM_BUSINESS_ACCOUNT_ID + page token required (Meta Graph API)",
            note: "Requires Meta app with instagram_content_publish permission after App Review.",
          };
        }
        // Caption-only container creation (media upload is multi-step)
        if (!req.mediaUrls?.length) {
          return {
            success: false,
            platform: "instagram",
            status: "failed",
            error: "Instagram feed posts require mediaUrls (image or video)",
          };
        }
        const createRes = await fetch(
          `https://graph.facebook.com/v19.0/${igUserId}/media`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image_url: req.mediaUrls[0],
              caption: req.text,
              access_token: token,
            }),
          }
        );
        if (!createRes.ok) {
          return {
            success: false,
            platform: "instagram",
            status: "failed",
            error: `IG create HTTP ${createRes.status}: ${(await createRes.text()).slice(0, 200)}`,
          };
        }
        const created = (await createRes.json()) as { id?: string };
        if (!created.id) {
          return { success: false, platform: "instagram", status: "failed", error: "No creation id" };
        }
        const pubRes = await fetch(
          `https://graph.facebook.com/v19.0/${igUserId}/media_publish`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ creation_id: created.id, access_token: token }),
          }
        );
        if (!pubRes.ok) {
          return {
            success: false,
            platform: "instagram",
            status: "failed",
            error: `IG publish HTTP ${pubRes.status}`,
          };
        }
        const published = (await pubRes.json()) as { id?: string };
        return { success: true, platform: "instagram", status: "published", externalId: published.id };
      }
      case "youtube": {
        return {
          success: false,
          platform: "youtube",
          status: "CONFIGURATION_REQUIRED",
          note: "YouTube upload requires OAuth with youtube.upload scope and resumable upload API. Wire after Google Cloud app verification.",
          error: "YouTube publish adapter requires verified Google Cloud OAuth app",
        };
      }
      default:
        return {
          success: false,
          platform: req.platform,
          status: "CONFIGURATION_REQUIRED",
          note: `Adapter for ${req.platform} requires official platform app credentials and review.`,
          error: `Publish adapter for ${req.platform} not fully wired — use official platform tools or extend connector.`,
        };
    }
  } catch (err) {
    return {
      success: false,
      platform: req.platform,
      status: "failed",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function listSocialStatus(): Array<{ platform: SocialPlatform; configured: boolean }> {
  const platforms: SocialPlatform[] = ["linkedin", "x", "facebook", "instagram", "youtube", "tiktok", "pinterest"];
  return platforms.map((platform) => ({
    platform,
    configured: Boolean(tokenFor(platform)),
  }));
}
