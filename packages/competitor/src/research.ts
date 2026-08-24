import { compareCompetitors, type CompetitorSnapshot } from "./intelligence";

export interface CompetitorResearchResult {
  urls: string[];
  snapshots: CompetitorSnapshot[];
  generatedAt: string;
}

export async function runCompetitorResearch(urls: string[]): Promise<CompetitorResearchResult> {
  return { urls, snapshots: await compareCompetitors(urls), generatedAt: new Date().toISOString() };
}

export function formatCompetitorResearchForPrompt(result: CompetitorResearchResult): string {
  if (result.snapshots.length === 0) return "";
  const lines = result.snapshots.map((s) =>
    s.ok
      ? `- ${s.url} — "${s.title ?? "untitled"}" (${s.wordCount} words, ${s.outboundLinkCount} outbound links)`
      : `- ${s.url} — could not fetch (${s.error ?? "unknown error"})`
  );
  return `Competitor snapshots (fetched ${result.generatedAt}):\n${lines.join("\n")}`;
}
