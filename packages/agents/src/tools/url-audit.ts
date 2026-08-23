/**
 * packages/queue/src/job-handlers.ts already imports runSafeUrlAudit from
 * "@superior-ai/agents" — didn't exist. "Safe" here means: bounded fetch
 * (timeout + size cap), no JS execution, no headless browser — just the raw
 * HTML checked for basic on-page SEO/content signals.
 */

export interface UrlAuditResult {
  url: string;
  ok: boolean;
  statusCode?: number;
  title?: string;
  metaDescription?: string;
  h1Count: number;
  wordCount: number;
  hasViewportMeta: boolean;
  issues: string[];
  error?: string;
}

const MAX_BYTES = 2_000_000;
const TIMEOUT_MS = 8_000;

export async function runSafeUrlAudit(url: string): Promise<UrlAuditResult> {
  if (!url || !/^https?:\/\//i.test(url)) {
    return { url, ok: false, h1Count: 0, wordCount: 0, hasViewportMeta: false, issues: [], error: "url must be a valid http(s) URL" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, redirect: "follow" });
    const reader = res.body?.getReader();
    let html = "";
    if (reader) {
      let received = 0;
      const decoder = new TextDecoder();
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.byteLength;
        html += decoder.decode(value, { stream: true });
        if (received > MAX_BYTES) {
          controller.abort();
          break;
        }
      }
    } else {
      html = await res.text();
    }

    const titleMatch = /<title[^>]*>([^<]*)<\/title>/i.exec(html);
    const metaDescMatch = /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i.exec(html);
    const viewportMatch = /<meta[^>]+name=["']viewport["']/i.exec(html);
    const h1Count = (html.match(/<h1[\s>]/gi) ?? []).length;
    const textOnly = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ");
    const wordCount = textOnly.split(/\s+/).filter(Boolean).length;

    const issues: string[] = [];
    if (!titleMatch?.[1]?.trim()) issues.push("Missing <title>.");
    if (!metaDescMatch?.[1]?.trim()) issues.push("Missing meta description.");
    if (h1Count === 0) issues.push("No <h1> found.");
    if (h1Count > 1) issues.push(`Multiple <h1> tags found (${h1Count}).`);
    if (!viewportMatch) issues.push("Missing viewport meta tag (mobile responsiveness).");
    if (wordCount < 150) issues.push(`Low text content (${wordCount} words) — may be thin for SEO.`);

    return {
      url,
      ok: res.ok,
      statusCode: res.status,
      title: titleMatch?.[1]?.trim(),
      metaDescription: metaDescMatch?.[1]?.trim(),
      h1Count,
      wordCount,
      hasViewportMeta: Boolean(viewportMatch),
      issues,
    };
  } catch (err) {
    return {
      url,
      ok: false,
      h1Count: 0,
      wordCount: 0,
      hasViewportMeta: false,
      issues: [],
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timeout);
  }
}
