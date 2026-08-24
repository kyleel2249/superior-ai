/**
 * packages/tools/src/index.ts already did `import "./browser"` for its
 * registration side-effect — the file didn't exist. Bounded fetch (timeout +
 * size cap), no JS execution, no headless browser — same "safe" contract as
 * agents/tools/url-audit.ts. Registers as a tool so agents can call it via
 * the registry rather than only through direct imports.
 */
import { registerTool } from "./registry";
import type { ToolResult } from "./types";

const MAX_BYTES = 3_000_000;
const TIMEOUT_MS = 10_000;

export interface BrowseResult {
  url: string;
  ok: boolean;
  statusCode?: number;
  title?: string;
  text?: string;
  links: Array<{ href: string; text: string }>;
  error?: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function browseUrl(url: string): Promise<BrowseResult> {
  if (!/^https?:\/\//i.test(url)) {
    return { url, ok: false, links: [], error: "url must be a valid http(s) URL" };
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, redirect: "follow" });
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) {
      return { url, ok: false, statusCode: res.status, links: [], error: `Response exceeded ${MAX_BYTES} byte cap.` };
    }
    const html = new TextDecoder().decode(buf);
    const title = /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1]?.trim();
    const links: Array<{ href: string; text: string }> = [];
    const linkRe = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let m: RegExpExecArray | null;
    while ((m = linkRe.exec(html)) && links.length < 50) {
      const href = m[1]!;
      if (href.startsWith("http")) links.push({ href, text: stripHtml(m[2]!).slice(0, 100) });
    }
    return { url, ok: res.ok, statusCode: res.status, title, text: stripHtml(html).slice(0, 20_000), links };
  } catch (err) {
    return { url, ok: false, links: [], error: err instanceof Error ? err.message : String(err) };
  } finally {
    clearTimeout(timeout);
  }
}

registerTool({
  name: "browse_url",
  description: "Fetch a single public URL and extract its title, text content, and links. No JS execution, bounded size/time. Never invents page content.",
  permissions: ["web_fetch"],
  sensitive: false,
  async execute(input): Promise<ToolResult> {
    const url = String(input.url ?? "").trim();
    if (!url) return { success: false, error: "url is required" };
    const result = await browseUrl(url);
    return { success: result.ok, data: result, provenance: "Observed Data" };
  },
});
