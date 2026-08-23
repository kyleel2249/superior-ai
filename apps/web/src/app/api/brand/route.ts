import { NextRequest, NextResponse } from "next/server";
import { generateLetterformConcepts, exportSvgDataUri, type BrandStyle } from "@superior-ai/brand";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.brandName) {
      return NextResponse.json({ error: "brandName is required" }, { status: 400 });
    }
    const result = generateLetterformConcepts({
      brandName: String(body.brandName),
      initials: body.initials,
      industry: body.industry,
      personality: body.personality,
      styles: body.styles as BrandStyle[] | undefined,
      colors: body.colors,
    });
    return NextResponse.json({
      ...result,
      concepts: result.concepts.map((c) => ({ ...c, svgDataUri: exportSvgDataUri(c.svgMark) })),
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
