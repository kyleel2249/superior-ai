/**
 * Live URL audit — real fetch + structural analysis.
 * No invented metrics: every score is derived from something actually observed
 * in the fetched HTML/headers. Anything we cannot measure without a headless
 * browser (Core Web Vitals, rendered layout, real conversion funnels) is
 * explicitly named as a gap in `recommendations`, never guessed at.
 */

import type { SeoAuditResult, DataProvenance } from "@superior-ai/core";
import { auditUrlPlaceholder } from "./engine";

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function extract(re: RegExp, html: string): string | undefined {
  return re.exec(html)?.[1]?.trim();
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface LiveAuditOptions {
  /** Abort the fetch after this many ms (default 8000). */
  timeoutMs?: number;
}

/**
 * Fetches the page live and derives real signals from it.
 * Falls back to the honest zero-confidence placeholder (never fabricated
 * data) if the fetch fails — offline sandbox, blocked domain, non-2xx, etc.
 */
export async function auditUrl(url: string, opts: LiveAuditOptions = {}): Promise<SeoAuditResult> {
  const timeoutMs = opts.timeoutMs ?? 8000;
  const technicalSignals: Record<string, unknown> = {};
  const recommendations: string[] = [];

  let html: string;
  let status: number;
  let ttfbMs: number;
  let bytes: number;
  let isHttps: boolean;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const started = Date.now();
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "SuperiorAI-SEO-Auditor/1.0 (+internal audit tool)" },
    });
    clearTimeout(timer);
    ttfbMs = Date.now() - started;
    status = res.status;
    isHttps = res.url.startsWith("https://");
    html = await res.text();
    bytes = new TextEncoder().encode(html).length;

    if (!res.ok) {
      recommendations.push(`Page responded with HTTP ${status} — fix before further audit`);
    }
  } catch (err) {
    // Honest failure path — same shape as the original placeholder,
    // never fabricated. Kept as its own labeled branch of the real function.
    const fallback = auditUrlPlaceholder(url);
    fallback.technicalSignals = {
      note: "Live fetch failed — no data was fabricated",
      error: err instanceof Error ? err.message : String(err),
    };
    fallback.recommendations = [
      "Live fetch failed (network, timeout, or blocked domain) — audit could not run",
      "Retry from an environment with outbound access to this URL",
      ...fallback.recommendations,
    ];
    return fallback;
  }

  const text = stripTags(html);
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  const title = extract(/<title[^>]*>([^<]*)<\/title>/i, html);
  const metaDescription = extract(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i,
    html
  );
  const canonical = extract(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i, html);
  const viewport = /<meta[^>]+name=["']viewport["']/i.test(html);
  const langAttr = extract(/<html[^>]+lang=["']([^"']*)["']/i, html);
  const robotsNoindex = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html);
  const h1Matches = html.match(/<h1[\s>]/gi) ?? [];
  const h2Matches = html.match(/<h2[\s>]/gi) ?? [];
  const imgMatches = [...html.matchAll(/<img\b[^>]*>/gi)];
  const imgsMissingAlt = imgMatches.filter((m) => !/\balt=["'][^"']*["']/i.test(m[0])).length;
  const hasStructuredData = /<script[^>]+type=["']application\/ld\+json["']/i.test(html);
  const internalLinkCount = [...html.matchAll(/<a\b[^>]+href=["']([^"']*)["']/gi)].filter((m) => {
    const href = m[1];
    try {
      return href.startsWith("/") || (href && new URL(href, url).host === new URL(url).host);
    } catch {
      return href.startsWith("/");
    }
  }).length;
  const hasForm = /<form\b/i.test(html);
  const ctaWords = /(get started|sign up|start free|book a demo|contact us|request a demo|try it free)/i.test(
    text
  );

  technicalSignals.status = status;
  technicalSignals.ttfbMs = ttfbMs;
  technicalSignals.bytes = bytes;
  technicalSignals.https = isHttps;
  technicalSignals.title = title ?? null;
  technicalSignals.titleLength = title?.length ?? 0;
  technicalSignals.metaDescription = metaDescription ?? null;
  technicalSignals.metaDescriptionLength = metaDescription?.length ?? 0;
  technicalSignals.canonical = canonical ?? null;
  technicalSignals.viewportMeta = viewport;
  technicalSignals.langAttribute = langAttr ?? null;
  technicalSignals.robotsNoindex = robotsNoindex;
  technicalSignals.h1Count = h1Matches.length;
  technicalSignals.h2Count = h2Matches.length;
  technicalSignals.imageCount = imgMatches.length;
  technicalSignals.imagesMissingAlt = imgsMissingAlt;
  technicalSignals.hasStructuredData = hasStructuredData;
  technicalSignals.internalLinkCount = internalLinkCount;
  technicalSignals.wordCount = wordCount;
  technicalSignals.hasForm = hasForm;
  technicalSignals.hasVisibleCta = ctaWords;

  // --- SEO score: on-page fundamentals, all directly observed ---
  let seoScore = 100;
  if (!title) { seoScore -= 20; recommendations.push("Missing <title> tag"); }
  else if (title.length < 15 || title.length > 65) { seoScore -= 8; recommendations.push(`Title length is ${title.length} chars — aim for ~30–60`); }
  if (!metaDescription) { seoScore -= 15; recommendations.push("Missing meta description"); }
  else if (metaDescription.length < 50 || metaDescription.length > 160) { seoScore -= 6; recommendations.push(`Meta description is ${metaDescription.length} chars — aim for ~50–155`); }
  if (h1Matches.length === 0) { seoScore -= 15; recommendations.push("No <h1> found"); }
  else if (h1Matches.length > 1) { seoScore -= 6; recommendations.push(`${h1Matches.length} <h1> tags found — use exactly one`); }
  if (!canonical) { seoScore -= 8; recommendations.push("No canonical link tag"); }
  if (robotsNoindex) { seoScore -= 30; recommendations.push("Page is marked noindex — it will not appear in search results"); }
  if (!hasStructuredData) { seoScore -= 6; recommendations.push("No JSON-LD structured data detected"); }

  // --- Accessibility: what's checkable without a rendered DOM ---
  let accessibilityScore = 100;
  if (!langAttr) { accessibilityScore -= 15; recommendations.push("Missing lang attribute on <html>"); }
  if (imgMatches.length > 0) {
    const missingRatio = imgsMissingAlt / imgMatches.length;
    accessibilityScore -= Math.round(missingRatio * 40);
    if (imgsMissingAlt > 0) recommendations.push(`${imgsMissingAlt}/${imgMatches.length} images missing alt text`);
  }
  if (!viewport) { accessibilityScore -= 15; recommendations.push("Missing responsive viewport meta tag"); }

  // --- Performance: coarse network-level proxy only, explicitly labeled ---
  let performanceScore = 100;
  if (ttfbMs > 1500) { performanceScore -= 30; recommendations.push(`Time to first byte was ${ttfbMs}ms — investigate server/CDN latency`); }
  else if (ttfbMs > 700) { performanceScore -= 12; }
  if (bytes > 1_500_000) { performanceScore -= 25; recommendations.push(`HTML payload is ${(bytes / 1e6).toFixed(2)}MB — consider trimming inline content`); }
  else if (bytes > 600_000) { performanceScore -= 10; }
  recommendations.push("Performance score is a network-response proxy only — run Lighthouse/CrUX for real Core Web Vitals");

  // --- Content: structural depth, no claims about quality/originality ---
  let contentScore = 60;
  if (wordCount < 150) { contentScore -= 25; recommendations.push(`Only ~${wordCount} words of visible text — thin content risk`); }
  else if (wordCount > 400) { contentScore += 15; }
  if (h2Matches.length >= 2) contentScore += 10;
  if (internalLinkCount === 0) { recommendations.push("No internal links detected"); }
  else if (internalLinkCount >= 3) contentScore += 10;
  contentScore = clamp(contentScore);

  // --- Trust: only checkable-without-rendering signals ---
  let trustScore = 70;
  if (isHttps) trustScore += 20; else { trustScore -= 30; recommendations.push("Page is not served over HTTPS"); }
  if (/<a[^>]+href=["'][^"']*(privacy|terms)[^"']*["']/i.test(html)) trustScore += 10;
  trustScore = clamp(trustScore);

  // --- Conversion: presence-only heuristic, deliberately low confidence ---
  let conversionScore = 40;
  if (hasForm) conversionScore += 25;
  if (ctaWords) conversionScore += 25;
  conversionScore = clamp(conversionScore);
  recommendations.push("Conversion score only checks for a form/CTA text presence — validate against real funnel data before acting on it");

  const dataQuality: DataProvenance = "Observed Data";
  // Confidence reflects what we could actually check vs. what needs a
  // headless browser or analytics access (CWV, rendered layout, real funnels).
  const confidence = 55;

  return {
    url,
    seoScore: clamp(seoScore),
    uxScore: clamp((accessibilityScore + performanceScore) / 2),
    conversionScore,
    contentScore,
    performanceScore: clamp(performanceScore),
    accessibilityScore: clamp(accessibilityScore),
    trustScore,
    recommendations: [...new Set(recommendations)],
    technicalSignals,
    dataQuality,
    confidence,
  };
}
