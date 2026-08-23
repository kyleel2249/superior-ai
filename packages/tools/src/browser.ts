/**
 * Browser / URL Intelligence Tool
 * Fetches public pages. Respects boundaries — no auth bypass.
 */

import { registerTool } from "./registry";
import type { ToolResult } from "./types";

registerTool({
  name: "url_fetch",
  description: "Fetch and extract text/metadata from a public URL.",
  permissions: ["browser"],
  sensitive: false,
  async execute(input): Promise<ToolResult> {
    const url = String(input.url ?? "").trim();
    if (!url || !/^https?:\/\//i.test(url)) {
      return { success: false, error: "Valid http(s) url required" };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "SUPERIOR-AI-ResearchBot/0.1 (+https://github.com/kyleel2249/superior-ai; research)",
          Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
        },
        redirect: "follow",
      });
      clearTimeout(timeout);

      if (!res.ok) {
        return {
          success: false,
          error: `HTTP ${res.status}`,
          provenance: "Observed Data",
        };
      }

      const contentType = res.headers.get("content-type") ?? "";
      const text = await res.text();
      const titleMatch = text.match(/<title[^>]*>([^<]*)<\/title>/i);
      const metaDesc = text.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
      const h1Match = text.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);

      // Strip scripts/styles roughly for text extract
      const stripped = text
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 12000);

      return {
        success: true,
        provenance: "Observed Data",
        data: {
          url: res.url,
          status: res.status,
          contentType,
          title: titleMatch?.[1]?.trim() ?? null,
          description: metaDesc?.[1]?.trim() ?? null,
          h1: h1Match?.[1]?.replace(/<[^>]+>/g, "").trim() ?? null,
          textExcerpt: stripped,
          length: text.length,
        },
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        provenance: "Observed Data",
      };
    }
  },
});

registerTool({
  name: "url_audit",
  description: "Basic public-page SEO/UX signal extraction from a URL.",
  permissions: ["browser"],
  sensitive: false,
  async execute(input, ctx): Promise<ToolResult> {
    const fetchTool = (await import("./registry")).getTool("url_fetch");
    if (!fetchTool) return { success: false, error: "url_fetch not registered" };
    const page = await fetchTool.execute(input, ctx);
    if (!page.success || !page.data) return page;

    const d = page.data as {
      title?: string | null;
      description?: string | null;
      h1?: string | null;
      textExcerpt?: string;
      url?: string;
    };

    const signals = {
      hasTitle: Boolean(d.title),
      titleLength: d.title?.length ?? 0,
      hasMetaDescription: Boolean(d.description),
      metaLength: d.description?.length ?? 0,
      hasH1: Boolean(d.h1),
      wordCountApprox: d.textExcerpt ? d.textExcerpt.split(/\s+/).length : 0,
    };

    const recommendations: string[] = [];
    if (!signals.hasTitle) recommendations.push("Add a clear <title>");
    if (signals.titleLength > 60) recommendations.push("Shorten title toward ~50–60 chars");
    if (!signals.hasMetaDescription) recommendations.push("Add meta description");
    if (!signals.hasH1) recommendations.push("Ensure a single clear H1");
    if (signals.wordCountApprox < 100) recommendations.push("Thin content — expand with useful information");

    return {
      success: true,
      provenance: "Observed Data",
      data: {
        url: d.url,
        signals,
        recommendations,
        note: "Partial technical audit from HTML only. Core Web Vitals and full SEO require additional measurement.",
      },
    };
  },
});
