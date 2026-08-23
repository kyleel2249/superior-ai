import { NextRequest, NextResponse } from "next/server";
import { generateLetterformConcepts } from "@superior-ai/brand";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const brandName = String(body.brandName ?? "").trim();
    if (!brandName) return NextResponse.json({ error: "brandName required" }, { status: 400 });
    const result = generateLetterformConcepts({
      brandName,
      initials: body.initials,
      industry: body.industry,
      personality: body.personality,
      styles: body.styles,
      colors: body.colors,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
