import { NextRequest, NextResponse } from "next/server";
import {
  researchCompetitors,
  emptyCompetitor,
  buildScorecard,
  generateCompetitiveBrief,
  messagingComparison,
  trafficIntelligenceShell,
  comparisonTemplate,
} from "@superior-ai/competitor";
import { rememberDurable } from "@superior-ai/memory";

export async function GET() {
  return NextResponse.json({
    actions: ["research", "brief", "messaging", "scorecard", "traffic"],
    note: "Public data only. Never fabricates traffic, revenue, or contacts.",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action ?? "research");
    const ourProduct = String(body.ourProduct ?? body.product ?? "Our product");

    let competitors = body.competitors as
      | Array<{ name: string; url?: string; domain?: string }>
      | undefined;

    if (!competitors?.length && body.names) {
      competitors = String(body.names)
        .split(/[,;\n]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((name) => ({ name }));
    }
    if (!competitors?.length && body.urls) {
      const urls = Array.isArray(body.urls) ? body.urls : String(body.urls).split(/[\s,]+/);
      competitors = urls
        .map((u: string) => u.trim())
        .filter(Boolean)
        .map((url: string) => ({
          name: url.replace(/^https?:\/\//, "").split("/")[0] || url,
          url: url.startsWith("http") ? url : `https://${url}`,
        }));
    }

    if (action === "traffic" && body.domain) {
      return NextResponse.json(trafficIntelligenceShell(String(body.domain)));
    }

    if (action === "messaging") {
      return NextResponse.json({
        rows: messagingComparison(
          String(body.ourMessage ?? ourProduct),
          Array.isArray(body.competitorMessages) ? body.competitorMessages : []
        ),
      });
    }

    if (action === "scorecard") {
      const profiles = (competitors ?? []).map((c) =>
        emptyCompetitor(c.name, c.url || c.domain || "https://unknown.invalid")
      );
      return NextResponse.json({
        scorecard: buildScorecard(profiles),
        comparisons: profiles.map((p) => comparisonTemplate(ourProduct, p.name)),
      });
    }

    if (action === "brief") {
      if (!competitors?.length) {
        return NextResponse.json({ error: "competitors required" }, { status: 400 });
      }
      // Optional: research first when live=true
      let profiles = competitors.map((c) =>
        emptyCompetitor(c.name, c.url || c.domain || "https://unknown.invalid")
      );
      if (body.live === true) {
        const researched = await researchCompetitors({
          ourProduct,
          competitors,
          focus: body.focus,
        });
        profiles = researched.profiles;
      }
      const brief = generateCompetitiveBrief({
        ourProduct,
        competitors: profiles,
        ourFeatures: body.ourFeatures,
        ourPositioning: body.ourPositioning,
      });
      return NextResponse.json(brief);
    }

    // default research
    if (!competitors?.length) {
      return NextResponse.json(
        { error: "Provide competitors[] with name/url, or names, or urls" },
        { status: 400 }
      );
    }

    const result = await researchCompetitors({
      ourProduct,
      competitors,
      focus: body.focus,
    });

    await rememberDurable({
      type: "competitor",
      content: `Competitor research for ${ourProduct}: ${competitors.map((c) => c.name).join(", ")}. Hits: ${result.searchHits.length}. Fetches: ${result.pageFetches.filter((p) => p.success).length}`,
      importance: 70,
      profileId: body.profileId,
      tags: ["competitor", "war-room"],
      metadata: { competitorCount: competitors.length },
    }).catch(() => undefined);

    if (body.includeBrief === true) {
      const brief = generateCompetitiveBrief({
        ourProduct,
        competitors: result.profiles,
        ourFeatures: body.ourFeatures,
        ourPositioning: body.ourPositioning,
      });
      return NextResponse.json({ ...result, brief });
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
