/**
 * Autonomous Content Calendar
 */

import type { Platform } from "@superior-ai/core";

export interface CalendarItem {
  id: string;
  date: string; // ISO date
  platform: Platform;
  contentType: string;
  title: string;
  status: "idea" | "draft" | "scheduled" | "published";
  caption?: string;
  assetIds?: string[];
}

export function generateWeekCalendar(product: string, platforms: Platform[] = ["linkedin", "instagram", "tiktok", "youtube"]): CalendarItem[] {
  const items: CalendarItem[] = [];
  const themes = [
    "Problem awareness",
    "Educational how-to",
    "UGC testimonial style",
    "Product demo snippet",
    "Founder insight",
    "Customer story",
    "SEO blog promo",
  ];
  const start = new Date();
  for (let d = 0; d < 7; d++) {
    const date = new Date(start);
    date.setDate(start.getDate() + d);
    const iso = date.toISOString().slice(0, 10);
    const platform = platforms[d % platforms.length]!;
    const theme = themes[d % themes.length]!;
    items.push({
      id: `cal_${iso}_${platform}`,
      date: iso,
      platform,
      contentType: theme,
      title: `${theme}: ${product}`,
      status: "idea",
      caption: `Draft angle for ${platform}: ${theme} featuring ${product}`,
    });
  }
  return items;
}

export function contentIdeas(product: string, count = 10): string[] {
  return [
    `5 mistakes teams make without ${product}`,
    `Day in the life: before and after ${product}`,
    `How ${product} saves follow-up time`,
    `Customer objection: "We already use spreadsheets"`,
    `Regional story: small business adopting ${product}`,
    `Feature deep-dive in 60 seconds`,
    `Founder lesson learned building ${product}`,
    `Comparison checklist: ${product} vs status quo`,
    `Behind the scenes of onboarding`,
    `FAQ reel answering top search questions`,
  ].slice(0, count);
}
