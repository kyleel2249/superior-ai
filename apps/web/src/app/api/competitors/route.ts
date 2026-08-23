import { NextRequest, NextResponse } from "next/server";
import { researchCompetitors } from "@superior-ai/competitor";
import { rememberDurable } from "@superior-ai/memory";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    note: "POST { ourProduct, competitors: [{ name, url? }], focus? } for structured war-room research.",
  });
}
