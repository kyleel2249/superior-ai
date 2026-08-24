/**
 * Batch URL analyzer — uses browser url_fetch tool.
 */

import { runTool } from "@superior-ai/tools";

export interface UrlAnalysis {
  url: string;
  ok: boolean;
  title?: string | null;
  description?: string | null;
  h1?: string | null;
  excerpt?: string;
  error?: string;
  links?: string[];
}

function extractLinks(htmlOrText: string, baseUrl: string): string[] {
  const links = new Set<string>();
  const re = /href=["'](https?:\/\/[^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(htmlOrText)) !== null) {
    try {
      const u = new URL(m[1]!);
      if (u.protocol === "http:" || u.protocol === "https:") links.add(u.href);
    } catch {
      /* skip */
    }
  }
  // relative links not in stripped text — skip
  void baseUrl;
  return [...links].slice(0, 25);
}

export async function analyzeUrls(
  urls: string[],
  opts?: { extractLinks?: boolean }
): Promise<UrlAnalysis[]> {
  const out: UrlAnalysis[] = [];
  for (const url of urls.slice(0, 10)) {
    if (!/^https?:\/\//i.test(url)) {
      out.push({ url, ok: false, error: "Only http(s) URLs allowed" });
      continue;
    }
    const result = await runTool(
      "url_fetch",
      { url },
      {
        approvalPolicy: "sensitive_only",
        grantedPermissions: ["browser"],
      }
    );
    if (!result.success) {
      out.push({ url, ok: false, error: result.error });
      continue;
    }
    const d = result.data as {
      title?: string | null;
      description?: string | null;
      h1?: string | null;
      textExcerpt?: string;
      url?: string;
    };
    out.push({
      url: d.url ?? url,
      ok: true,
      title: d.title,
      description: d.description,
      h1: d.h1,
      excerpt: d.textExcerpt?.slice(0, 3000),
      links: opts?.extractLinks && d.textExcerpt ? extractLinks(d.textExcerpt, url) : undefined,
    });
  }
  return out;
}
