/**
 * packages/competitor/src/index.ts already declared `export * from "./intelligence"`
 * and `export * from "./research"` — neither file existed, and nothing in the
 * repo currently imports @superior-ai/competitor at all. Built to match the
 * package's declared dependency on @superior-ai/tools (browseUrl) rather than
 * left as a dead export, since a future consumer will need a real API to design
 * against, not a stub.
 */
import { browseUrl } from "@superior-ai/tools";

export interface CompetitorSnapshot {
  url: string;
  ok: boolean;
  title?: string;
  wordCount: number;
  outboundLinkCount: number;
  checkedAt: string;
  error?: string;
}

export async function snapshotCompetitor(url: string): Promise<CompetitorSnapshot> {
  const page = await browseUrl(url);
  return {
    url,
    ok: page.ok,
    title: page.title,
    wordCount: page.text ? page.text.split(/\s+/).filter(Boolean).length : 0,
    outboundLinkCount: page.links.length,
    checkedAt: new Date().toISOString(),
    error: page.error,
  };
}

export async function compareCompetitors(urls: string[]): Promise<CompetitorSnapshot[]> {
  const results: CompetitorSnapshot[] = [];
  for (const url of urls) {
    results.push(await snapshotCompetitor(url));
  }
  return results;
}
