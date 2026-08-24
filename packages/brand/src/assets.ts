/**
 * Brand social & ad asset specifications (structure, not fake images).
 */

export interface AssetSpec {
  name: string;
  platform: string;
  width: number;
  height: number;
  notes: string;
}

export function brandAssetSpecs(brandName: string): AssetSpec[] {
  return [
    {
      name: "favicon",
      platform: "web",
      width: 32,
      height: 32,
      notes: `${brandName} monogram on solid tile; flat SVG preferred`,
    },
    {
      name: "og-image",
      platform: "web",
      width: 1200,
      height: 630,
      notes: "Wordmark + tagline; high contrast; safe margins 64px",
    },
    {
      name: "instagram-post",
      platform: "instagram",
      width: 1080,
      height: 1080,
      notes: "Centered mark; minimal text",
    },
    {
      name: "instagram-story",
      platform: "instagram",
      width: 1080,
      height: 1920,
      notes: "Vertical lockup; top/bottom safe zones",
    },
    {
      name: "linkedin-banner",
      platform: "linkedin",
      width: 1584,
      height: 396,
      notes: "Wide wordmark left; avoid edge critical elements",
    },
    {
      name: "ad-landscape",
      platform: "ads",
      width: 1200,
      height: 628,
      notes: "Offer + CTA area; brand mark secondary",
    },
  ];
}
