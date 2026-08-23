export type SocialPlatform = "x" | "linkedin" | "facebook";

export interface SocialPostInput {
  platform: SocialPlatform;
  text: string;
  accessToken?: string;
  // LinkedIn requires the author's URN; Facebook requires a target Page ID.
  authorUrn?: string;
  pageId?: string;
  mediaUrls?: string[];
}

export interface SocialPostResult {
  success: boolean;
  platform: SocialPlatform;
  postId?: string;
  status?: number;
  error?: string;
}

// Only official platform APIs — no scraping, no headless-browser automation.
export function listSocialStatus(): Array<{ platform: SocialPlatform; label: string; requires: string[] }> {
  return [
    { platform: "x", label: "X (Twitter)", requires: ["accessToken (OAuth 2.0 user token, tweet.write scope)"] },
    { platform: "linkedin", label: "LinkedIn", requires: ["accessToken", "authorUrn (urn:li:person:... or urn:li:organization:...)"] },
    { platform: "facebook", label: "Facebook Page", requires: ["accessToken (Page access token)", "pageId"] },
  ];
}

async function postToX(input: SocialPostInput): Promise<SocialPostResult> {
  if (!input.accessToken) return { success: false, platform: "x", error: "accessToken required" };
  try {
    const res = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: { Authorization: `Bearer ${input.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text: input.text }),
    });
    const data = (await res.json().catch(() => ({}))) as { data?: { id?: string }; detail?: string };
    return { success: res.ok, platform: "x", status: res.status, postId: data.data?.id, error: res.ok ? undefined : data.detail };
  } catch (err) {
    return { success: false, platform: "x", error: err instanceof Error ? err.message : String(err) };
  }
}

async function postToLinkedIn(input: SocialPostInput): Promise<SocialPostResult> {
  if (!input.accessToken || !input.authorUrn) return { success: false, platform: "linkedin", error: "accessToken and authorUrn required" };
  try {
    const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author: input.authorUrn,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: input.text },
            shareMediaCategory: "NONE",
          },
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
      }),
    });
    const postId = res.headers.get("x-restli-id") ?? undefined;
    const data = res.ok ? {} : await res.json().catch(() => ({}));
    return { success: res.ok, platform: "linkedin", status: res.status, postId, error: res.ok ? undefined : JSON.stringify(data) };
  } catch (err) {
    return { success: false, platform: "linkedin", error: err instanceof Error ? err.message : String(err) };
  }
}

async function postToFacebook(input: SocialPostInput): Promise<SocialPostResult> {
  if (!input.accessToken || !input.pageId) return { success: false, platform: "facebook", error: "accessToken and pageId required" };
  try {
    const params = new URLSearchParams({ message: input.text, access_token: input.accessToken });
    const res = await fetch(`https://graph.facebook.com/v19.0/${input.pageId}/feed`, { method: "POST", body: params });
    const data = (await res.json().catch(() => ({}))) as { id?: string; error?: { message?: string } };
    return { success: res.ok, platform: "facebook", status: res.status, postId: data.id, error: res.ok ? undefined : data.error?.message };
  } catch (err) {
    return { success: false, platform: "facebook", error: err instanceof Error ? err.message : String(err) };
  }
}

export async function publishPost(input: SocialPostInput): Promise<SocialPostResult> {
  if (!input.text?.trim()) return { success: false, platform: input.platform, error: "text required" };
  if (input.mediaUrls?.length) {
    // Each platform's media-attach flow needs its own upload/asset-registration
    // step before the post call — not implemented yet. Fail honestly rather
    // than silently posting text-only and pretending the media was attached.
    return { success: false, platform: input.platform, error: "mediaUrls not yet supported — text-only posts only" };
  }
  switch (input.platform) {
    case "x": return postToX(input);
    case "linkedin": return postToLinkedIn(input);
    case "facebook": return postToFacebook(input);
    default: return { success: false, platform: input.platform, error: "Unsupported platform" };
  }
}
