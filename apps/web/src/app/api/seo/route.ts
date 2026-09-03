import { NextRequest, NextResponse } from "next/server";
import {
  clusterKeywords,
  planContentFactory,
  analyzeIntent,
  generateSeoBrief,
  generateArticleDraft,
  suggestSchema,
  competitorContentGaps,
  seoMetadata,
  auditUrlPlaceholder,
  auditUrl,
} from "@superior-ai/seo";

export async function GET(req: NextRequest) {
  const topic = req.nextUrl.searchParams.get("topic") ?? "crm software";
  return NextResponse.json({
    sampleCluster: clusterKeywords(topic),
    actions: ["cluster", "intent", "brief", "article", "gaps", "schema", "audit"],
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action ?? "brief");
    const topic = String(body.topic ?? body.keyword ?? "topic");

    if (action === "cluster") {
      return NextResponse.json({
        cluster: clusterKeywords(topic, body.industry),
        contentPlan: planContentFactory(topic),
      });
    }
    if (action === "intent") {
      return NextResponse.json(analyzeIntent(topic));
    }
    if (action === "brief") {
      return NextResponse.json(
        generateSeoBrief({
          topic,
          audience: body.audience,
          industry: body.industry,
        })
      );
    }
    if (action === "article") {
      return NextResponse.json(
        generateArticleDraft({
          topic,
          audience: body.audience,
          industry: body.industry,
        })
      );
    }
    if (action === "gaps") {
      return NextResponse.json(
        competitorContentGaps(topic, Array.isArray(body.competitorTopics) ? body.competitorTopics : [])
      );
    }
    if (action === "schema") {
      return NextResponse.json({
        schema: suggestSchema(body.pageType ?? "article"),
      });
    }
    if (action === "metadata") {
      return NextResponse.json(
        seoMetadata(String(body.title ?? topic), String(body.description ?? topic))
      );
    }
    if (action === "audit") {
      const targetUrl = String(body.url ?? "https://example.com");
      // Real live-fetch audit; auditUrl itself falls back to the honest
      // zero-confidence placeholder (auditUrlPlaceholder) if the fetch fails,
      // so this path never fabricates data either way.
      return NextResponse.json(await auditUrl(targetUrl));
    }
    if (action === "audit_shell") {
      // Kept for callers that explicitly want the zero-confidence shell
      // without making a live network request (e.g. offline dev, previews).
      return NextResponse.json(auditUrlPlaceholder(String(body.url ?? "https://example.com")));
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
