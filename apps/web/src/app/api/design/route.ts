import { NextRequest, NextResponse } from "next/server";
import {
  createDocument,
  addRect,
  addBezierPath,
  addLinearGradient,
  createBrandDesignSystem,
  exportSvg,
  booleanPaths,
  parseD,
  pathToD,
  shapeBuilderRect,
} from "@superior-ai/design";

export async function GET() {
  return NextResponse.json({
    capabilities: [
      "path/pen/bezier/nodes",
      "boolean union|intersect|subtract|exclude",
      "gradients",
      "patterns",
      "text on path",
      "symbols",
      "svg export",
      "design systems",
    ],
    actions: ["create", "brand_system", "bezier", "boolean", "export_svg"],
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action ?? "create");

    if (action === "brand_system") {
      const doc = createBrandDesignSystem(String(body.brandName ?? "Brand"));
      return NextResponse.json({ document: doc, svg: exportSvg(doc) });
    }

    if (action === "create") {
      let doc = createDocument({
        name: body.name,
        width: body.width,
        height: body.height,
      });
      if (body.rect) {
        doc = addRect(doc, body.rect);
      }
      if (Array.isArray(body.points) && body.points.length >= 2) {
        doc = addBezierPath(doc, body.points, body.pathStyle);
      }
      if (Array.isArray(body.gradientStops)) {
        const g = addLinearGradient(doc, body.gradientStops);
        doc = g.doc;
      }
      return NextResponse.json({ document: doc, svg: exportSvg(doc) });
    }

    if (action === "bezier") {
      const points = Array.isArray(body.points) ? body.points : [];
      let doc = createDocument({ name: "Bezier" });
      doc = addBezierPath(doc, points, { stroke: body.stroke ?? "#e2e8f0", fill: "none" });
      return NextResponse.json({ document: doc, svg: exportSvg(doc), d: pathToD(doc.nodes[0] && doc.nodes[0].kind === "path" ? doc.nodes[0].commands : []) });
    }

    if (action === "boolean") {
      const a = parseD(String(body.pathA ?? "M0 0 L100 0 L100 100 Z"));
      const b = parseD(String(body.pathB ?? "M50 50 L150 50 L150 150 Z"));
      const result = booleanPaths(body.op ?? "union", a, b);
      return NextResponse.json(result);
    }

    if (action === "shape_builder") {
      const result = shapeBuilderRect(
        Number(body.x ?? 0),
        Number(body.y ?? 0),
        Number(body.w ?? 100),
        Number(body.h ?? 100),
        body.op ?? "union",
        parseD(String(body.pathB ?? "M40 40 L120 40 L120 120 Z"))
      );
      return NextResponse.json(result);
    }

    if (action === "export_svg" && body.document) {
      return NextResponse.json({ svg: exportSvg(body.document) });
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
