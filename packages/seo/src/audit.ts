function isPrivateHost(hostname: string): boolean {
  return /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0|::1)/i.test(hostname) || hostname.endsWith(".local");
}

export interface SeoFinding {
  check: string;
  passed: boolean;
  detail: string;
}

export interface SeoAuditResult {
  ok: boolean;
  url: string;
  statusCode?: number;
  findings: SeoFinding[];
  error?: string;
}

/** Real fetch-based on-page SEO checks. No fabricated scores or rankings — those require search-console/GSC access this package doesn't have. */
export async function auditPage(rawUrl: string): Promise<SeoAuditResult> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, url: rawUrl, findings: [], error: "Invalid URL" };
  }
  if (isPrivateHost(url.hostname)) return { ok: false, url: rawUrl, findings: [], error: "Local/private hosts are blocked" };

  try {
    const res = await fetch(url.toString(), { headers: { "User-Agent": "SuperiorAI-SEO/1.0" }, signal: AbortSignal.timeout(10_000) });
    const html = await res.text();
    const title = /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1]?.trim() ?? "";
    const metaDesc = /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i.exec(html)?.[1] ?? "";
    const h1Count = (html.match(/<h1[\s>]/gi) ?? []).length;
    const hasCanonical = /<link[^>]+rel=["']canonical["']/i.test(html);
    const hasOgTags = /<meta[^>]+property=["']og:/i.test(html);
    const imgTags = html.match(/<img\b[^>]*>/gi) ?? [];
    const imgsMissingAlt = imgTags.filter((t) => !/alt=["'][^"']+["']/i.test(t)).length;
    const robotsRes = await fetch(`${url.origin}/robots.txt`).catch(() => null);

    const findings: SeoFinding[] = [
      { check: "title_tag", passed: title.length > 0 && title.length <= 60, detail: `Title (${title.length} chars): "${title}"` },
      { check: "meta_description", passed: metaDesc.length >= 50 && metaDesc.length <= 160, detail: `Meta description (${metaDesc.length} chars)` },
      { check: "single_h1", passed: h1Count === 1, detail: `Found ${h1Count} <h1> tag(s)` },
      { check: "canonical_tag", passed: hasCanonical, detail: hasCanonical ? "Canonical link present" : "No canonical link found" },
      { check: "open_graph_tags", passed: hasOgTags, detail: hasOgTags ? "OG tags present" : "No og: meta tags found" },
      { check: "image_alt_text", passed: imgsMissingAlt === 0, detail: `${imgsMissingAlt} of ${imgTags.length} images missing alt text` },
      { check: "robots_txt", passed: Boolean(robotsRes?.ok), detail: robotsRes?.ok ? "robots.txt reachable" : "robots.txt missing or unreachable" },
    ];
    return { ok: res.ok, url: url.toString(), statusCode: res.status, findings };
  } catch (err) {
    return { ok: false, url: rawUrl, findings: [], error: err instanceof Error ? err.message : String(err) };
  }
}
