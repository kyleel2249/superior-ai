import { NextRequest, NextResponse } from "next/server";
import {
  generateLetterformConcepts,
  exportSvgDataUri,
  buildBrandKitPack,
  brandAssetSpecs,
  exportBrandKitJson,
  type BrandStyle,
} from "@superior-ai/brand";
import { rememberDurable } from "@superior-ai/memory";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const system = generateLetterformConcepts({
      brandName: String(body.brandName ?? body.name ?? "Brand"),
      initials: body.initials,
      industry: body.industry,
      personality: body.personality,
      styles: body.styles as BrandStyle[] | undefined,
      colors: body.colors,
    });

    await rememberDurable({
      type: "creative",
      key: `brand:${system.brandName.toLowerCase()}`,
      content: `Brand system for ${system.brandName} (${system.industry}): styles ${system.concepts.map((c) => c.style).join(", ")}; palette ${system.palette.map((p) => p.hex).join(", ")}`,
      importance: 75,
      profileId: body.profileId,
      tags: ["brand", "letterform", system.industry],
      metadata: { brandId: system.id },
    });

    const pack = buildBrandKitPack(system);

    if (body.export === "kit" || body.action === "export_kit") {
      const json = exportBrandKitJson(system);
      return new NextResponse(json, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${system.brandName.replace(/\s+/g, "-").toLowerCase()}-brand-kit.json"`,
        },
      });
    }

    return NextResponse.json({
      ...system,
      concepts: system.concepts.map((c) => ({
        ...c,
        svgDataUri: exportSvgDataUri(c.svgMark),
      })),
      kit: pack.manifest,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    styles: [
      "geometric",
      "curved",
      "minimalist",
      "luxury",
      "futuristic",
      "corporate",
      "technology",
      "playful",
      "bold",
      "architectural",
      "monogram",
    ],
    note: "POST brandName, optional initials/industry/personality/styles/colors. Set export:\"kit\" for full brand kit JSON pack.",
  });
}
