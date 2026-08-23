function isPrivateHost(hostname: string): boolean {
  return /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0|::1)/i.test(hostname) || hostname.endsWith(".local");
}

export interface UrlAuditResult {
  ok: boolean;
  url: string;
  statusCode?: number;
  latencyMs?: number;
  title?: string;
  metaDescription?: string;
  metaDescriptionLength?: number;
  hasViewportMeta?: boolean;
  h1Count?: number;
  error?: string;
}

/** Real fetch-based on-page check. Blocks private/local targets. No fabricated scores. */
export async function runSafeUrlAudit(rawUrl: string): Promise<UrlAuditResult> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, url: rawUrl, error: "Invalid URL" };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { ok: false, url: rawUrl, error: "Only http(s) URLs allowed" };
  }
  if (isPrivateHost(url.hostname)) {
    return { ok: false, url: rawUrl, error: "Local/private hosts are blocked" };
  }

  const started = Date.now();
  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "SuperiorAI-URLAudit/1.0" },
      signal: AbortSignal.timeout(10_000),
    });
    const latencyMs = Date.now() - started;
    const html = res.headers.get("content-type")?.includes("html") ? await res.text() : "";
    const title = /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1]?.trim();
    const metaDesc = /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i.exec(html)?.[1];
    const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
    const h1Count = (html.match(/<h1[\s>]/gi) ?? []).length;
    return {
      ok: res.ok,
      url: url.toString(),
      statusCode: res.status,
      latencyMs,
      title,
      metaDescription: metaDesc,
      metaDescriptionLength: metaDesc?.length,
      hasViewportMeta: hasViewport,
      h1Count,
    };
  } catch (err) {
    return { ok: false, url: rawUrl, latencyMs: Date.now() - started, error: err instanceof Error ? err.message : String(err) };
  }
}
