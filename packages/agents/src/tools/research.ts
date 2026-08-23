/**
 * Research tool — fetch permitted public URLs, extract evidence, cite sources.
 * Never invents URLs, statistics, or quotes. Estimates are labeled.
 */

export type EvidenceConfidence = "observed" | "extracted" | "inferred" | "unknown";

export interface ResearchSource {
  url: string;
  title?: string;
  statusCode?: number;
  ok: boolean;
  accessedAt: string;
  excerpt?: string;
  wordCount?: number;
  error?: string;
}

export interface ResearchClaim {
  claim: string;
  sourceUrls: string[];
  confidence: EvidenceConfidence;
  note?: string;
}

export interface ResearchResult {
  query: string;
  sources: ResearchSource[];
  claims: ResearchClaim[];
  summary?: string;
  synthesisModel?: string;
  notes: string[];
  executedAt: string;
}

const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 10_000;
const MAX_URLS = 5;

function extractText(html: string): { title?: string; text: string } {
  const titleMatch = /<title[^>]*>([^<]*)<\/title>/i.exec(html);
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
  return { title: titleMatch?.[1]?.trim(), text };
}

export async function fetchPublicUrl(url: string): Promise<ResearchSource> {
  const accessedAt = new Date().toISOString();
  if (!url || !/^https?:\/\//i.test(url)) {
    return { url, ok: false, accessedAt, error: "Only http(s) URLs are allowed" };
  }
  try {
    const u = new URL(url);
    if (
      /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0|::1)/i.test(u.hostname) ||
      u.hostname.endsWith(".local")
    ) {
      return { url, ok: false, accessedAt, error: "Internal or link-local hosts are blocked" };
    }
  } catch {
    return { url, ok: false, accessedAt, error: "Invalid URL" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "SUPERIOR-AI-Research/0.1 (public-read; respectful)" },
    });
    const reader = res.body?.getReader();
    let html = "";
    if (reader) {
      let received = 0;
      const decoder = new TextDecoder();
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
    const { title, text } = extractText(html);
    const excerpt = text.slice(0, 2500);
    return {
      url,
      title,
      statusCode: res.status,
      ok: res.ok,
      accessedAt,
      excerpt,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      error: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      url,
      ok: false,
      accessedAt,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function runResearch(input: {
  query: string;
  urls?: string[];
}): Promise<ResearchResult> {
  const notes: string[] = [];
  const urls = (input.urls ?? []).filter(Boolean).slice(0, MAX_URLS);
  if (urls.length === 0) {
    notes.push(
      "No URLs provided. Research only fetches user-supplied public URLs — it does not invent search results or sources."
    );
    return {
      query: input.query,
      sources: [],
      claims: [],
      notes,
      executedAt: new Date().toISOString(),
    };
  }

  const sources = await Promise.all(urls.map((u) => fetchPublicUrl(u)));
  const okSources = sources.filter((s) => s.ok && s.excerpt);

  const claims: ResearchClaim[] = [];
  for (const s of okSources) {
    const first = (s.excerpt ?? "").split(/(?<=[.!?])\s+/).slice(0, 3).join(" ").trim();
    if (first) {
      claims.push({
        claim: first.slice(0, 500),
        sourceUrls: [s.url],
        confidence: "extracted",
        note: s.title ? `From page title/context: ${s.title}` : undefined,
      });
    }
  }

  if (okSources.length === 0) {
    notes.push("No sources returned usable content. Check URLs, network, or robots/rate limits.");
  } else {
    notes.push(
      `Fetched ${okSources.length}/${sources.length} sources successfully. Claims below are extracted excerpts, not model-generated facts.`
    );
  }

  return {
    query: input.query,
    sources,
    claims,
    notes,
    executedAt: new Date().toISOString(),
  };
}

export function formatResearchForPrompt(result: ResearchResult): string {
  if (result.sources.length === 0) {
    return `Research query: ${result.query}\nNo sources fetched. Do not invent citations or statistics.`;
  }
  const lines: string[] = [
    `Research query: ${result.query}`,
    `Accessed at: ${result.executedAt}`,
    "",
    "SOURCES (use only these; cite by URL):",
  ];
  for (const s of result.sources) {
    if (!s.ok) {
      lines.push(`- FAIL ${s.url} — ${s.error ?? "unavailable"}`);
      continue;
    }
    lines.push(
      `- ${s.url}\n  title: ${s.title ?? "(none)"}\n  status: ${s.statusCode}\n  excerpt: ${(s.excerpt ?? "").slice(0, 1200)}`
    );
  }
  lines.push(
    "",
    "RULES: Only cite the sources above. Label anything not directly supported as inference. Never invent URLs or quotes."
  );
  return lines.join("\n");
}
