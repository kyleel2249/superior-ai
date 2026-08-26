/**
 * Result merge utilities — URL-dedupe, rank by engine diversity.
 */

import type { SearchHit, SearchResponse } from "./types";

/** Normalize URL for dedupe (strip hash, trailing slash, lowercase host path) */
export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    let path = u.pathname.replace(/\/+$/, "") || "/";
    return `${u.protocol}//${u.host.toLowerCase()}${path}${u.search}`.toLowerCase();
  } catch {
    return url.replace(/#.*$/, "").replace(/\/+$/, "").toLowerCase();
  }
}

/** Merge engine responses into unique hits (first-seen wins). */
export function mergeSearchHits(responses: SearchResponse[]): SearchHit[] {
  const seen = new Set<string>();
  const merged: SearchHit[] = [];
  for (const resp of responses) {
    for (const hit of resp.results ?? []) {
      const key = normalizeUrl(hit.url || "");
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push({
        ...hit,
        engine: hit.engine ?? String(resp.engine),
      });
    }
  }
  return merged;
}

/** Compact status line for APIs / UI */
export function formatEngineSummary(responses: SearchResponse[]): string {
  const withHits = responses.filter((r) => (r.results?.length ?? 0) > 0).length;
  const needConfig = responses.filter((r) => r.status === "CONFIGURATION_REQUIRED").length;
  const errors = responses.filter((r) => r.status === "ERROR").length;
  const merged = mergeSearchHits(responses).length;
  return `Hits from ${withHits}/${responses.length} engines · unique URLs ${merged} · need keys ${needConfig} · errors ${errors}`;
}
