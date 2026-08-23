/**
 * Competitor research — live search + URL fetch, structured comparison.
 * Never fabricates traffic, revenue, or contact data.
 */

import { liveSearch, type SearchHit } from "@superior-ai/tools";
import { runTool } from "@superior-ai/tools";
import {
  emptyCompetitor,
  buildScorecard,
  trafficIntelligenceShell,
  comparisonTemplate,
  type CompetitorProfile,
} from "./intelligence";

export interface CompetitorResearchInput {
  ourProduct: string;
  competitors: Array<{ name: string; url?: string; domain?: string }>;
  focus?: string;
}

export interface CompetitorResearchResult {
  ourProduct: string;
  profiles: CompetitorProfile[];
  scorecard: ReturnType<typeof buildScorecard>;
  comparisons: string[];
  searchHits: SearchHit[];
  pageFetches: Array<{
    url: string;
    title?: string;
    excerpt?: string;
    success: boolean;
    error?: string;
  }>;
  trafficShells: Array<ReturnType<typeof trafficIntelligenceShell>>;
  notes: string[];
  provenance: string;
}

export async function researchCompetitors(
  input: CompetitorResearchInput
): Promise<CompetitorResearchResult> {
  const notes: string[] = [];
  const searchHits: SearchHit[] = [];
  const pageFetches: CompetitorResearchResult["pageFetches"] = [];
  const profiles: CompetitorProfile[] = [];
  const trafficShells: CompetitorResearchResult["trafficShells"] = [];

  const focus = input.focus || "pricing positioning features acquisition";

  for (const c of input.competitors.slice(0, 5)) {
    const q = `${c.name} ${focus}`.trim();
    try {
      const search = await liveSearch(q);
      if (search.results.length) {
        searchHits.push(...search.results.slice(0, 5));
        notes.push(`Search (${search.engine}) for ${c.name}: ${search.results.length} hits`);
      } else {
        notes.push(`Search for ${c.name}: ${search.note ?? "no results"}`);
      }
    } catch (e) {
      notes.push(`Search error for ${c.name}: ${e instanceof Error ? e.message : String(e)}`);
    }

    const url = c.url || (c.domain ? `https://${c.domain.replace(/^https?:\/\//, "")}` : undefined);
    if (url) {
      const fetched = await runTool(
        "url_fetch",
        { url },
        {
          approvalPolicy: "sensitive_only",
          grantedPermissions: ["browser", "web_search"],
        }
      );
      if (fetched.success && fetched.data) {
        const d = fetched.data as { title?: string; textExcerpt?: string; url?: string };
        pageFetches.push({
          url: d.url ?? url,
          title: d.title,
          excerpt: (d.textExcerpt ?? "").slice(0, 600),
          success: true,
        });
        const profile = emptyCompetitor(c.name, d.url ?? url);
        profile.positioning = `Observed title: ${d.title ?? "n/a"}`;
        if (d.textExcerpt) profile.contentTopics = [d.textExcerpt.slice(0, 120)];
        profiles.push(profile);
      } else {
        pageFetches.push({
          url,
          success: false,
          error: fetched.error ?? "fetch failed",
        });
        profiles.push(emptyCompetitor(c.name, url));
      }
      trafficShells.push(trafficIntelligenceShell(url.replace(/^https?:\/\//, "").split("/")[0]!));
    } else {
      profiles.push(emptyCompetitor(c.name, "https://unknown.invalid"));
      notes.push(`No URL for ${c.name} — profile is a shell only.`);
    }
  }

  const scorecard = buildScorecard(profiles);
  const comparisons = input.competitors.map((c) =>
    comparisonTemplate(input.ourProduct, c.name)
  );

  return {
    ourProduct: input.ourProduct,
    profiles,
    scorecard,
    comparisons,
    searchHits: searchHits.slice(0, 20),
    pageFetches,
    trafficShells,
    notes,
    provenance:
      "Observed Data where fetches/search succeeded; Model Inference for empty shells. Traffic numbers never fabricated.",
  };
}
