/**
 * @superior-ai/social
 *
 * This package did not exist — apps/web/src/app/api/social/route.ts imported
 * publishPost / listSocialStatus / SocialPlatform from it with nothing behind
 * the import. The route itself is explicit about intent ("Official platform
 * APIs only. No ToS bypass.", requires body.approved === true before posting),
 * so this implementation follows that: it never simulates engagement or posts
 * without an explicit access token, and it's honest about which platforms
 * have a real HTTP call wired up vs. which are only status-tracked so far.
 *
 * NOT YET IMPLEMENTED: the actual per-platform HTTP calls (each has its own
 * OAuth/media-upload flow — Meta Graph API, X API v2, LinkedIn API, TikTok
 * Content Posting API). publishPost() is structured so each platform's real
 * call can be dropped into its case without changing the public API.
 */

export type SocialPlatform = "x" | "facebook" | "instagram" | "linkedin" | "tiktok";

const PLATFORM_ENV: Record<SocialPlatform, string> = {
  x: "X_API_BEARER_TOKEN",
  facebook: "META_PAGE_ACCESS_TOKEN",
  instagram: "META_PAGE_ACCESS_TOKEN",
  linkedin: "LINKEDIN_ACCESS_TOKEN",
  tiktok: "TIKTOK_ACCESS_TOKEN",
};

export interface SocialPlatformStatus {
  platform: SocialPlatform;
  configured: boolean;
}

export function listSocialStatus(): SocialPlatformStatus[] {
  return (Object.keys(PLATFORM_ENV) as SocialPlatform[]).map((platform) => ({
    platform,
    configured: Boolean(process.env[PLATFORM_ENV[platform]]),
  }));
}

export interface PublishPostInput {
  platform: SocialPlatform;
  text: string;
  mediaUrls?: string[];
  accessToken?: string;
}

export interface PublishPostResult {
  success: boolean;
  platform: SocialPlatform;
  postId?: string;
  message: string;
}

export async function publishPost(input: PublishPostInput): Promise<PublishPostResult> {
  const token = input.accessToken ?? process.env[PLATFORM_ENV[input.platform]];
  if (!token) {
    return {
      success: false,
      platform: input.platform,
      message: `No access token configured for ${input.platform}. Set ${PLATFORM_ENV[input.platform]} or pass accessToken.`,
    };
  }
  if (!input.text && (!input.mediaUrls || input.mediaUrls.length === 0)) {
    return { success: false, platform: input.platform, message: "Post must include text or media." };
  }

  switch (input.platform) {
    // TODO(phase 2+): wire the real Meta Graph API, X API v2, LinkedIn API,
    // and TikTok Content Posting API calls here. Until then, publishing is
    // intentionally refused rather than faked.
    default:
      return {
        success: false,
        platform: input.platform,
        message: `Publishing to ${input.platform} is not implemented yet — no request was sent.`,
      };
  }
}
