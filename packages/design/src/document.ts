/**
 * Design document factory and design-system helpers.
 */

import type { DesignDocument, PathNode, Paint, SymbolDef, VectorNode } from "./types";
import { bezierThrough, rectPath } from "./path";
import { documentToSvg } from "./svg";

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function createDocument(input?: {
  name?: string;
  width?: number;
  height?: number;
}): DesignDocument {
  const now = new Date().toISOString();
  return {
    id: id("doc"),
    name: input?.name ?? "Untitled",
    width: input?.width ?? 1024,
    height: input?.height ?? 1024,
    nodes: [],
    gradients: [],
    symbols: [],
    patterns: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function addRect(
  doc: DesignDocument,
  opts: { x: number; y: number; width: number; height: number; fill?: Paint; rx?: number; name?: string }
): DesignDocument {
  const node: VectorNode = {
    kind: "rect",
    id: id("rect"),
    name: opts.name,
    x: opts.x,
    y: opts.y,
    width: opts.width,
    height: opts.height,
    rx: opts.rx,
    fill: opts.fill ?? "#6366f1",
  };
  return { ...doc, nodes: [...doc.nodes, node], updatedAt: new Date().toISOString() };
}

export function addBezierPath(
  doc: DesignDocument,
  points: Array<{ x: number; y: number }>,
  opts?: { fill?: Paint; stroke?: Paint; name?: string }
): DesignDocument {
  const node: PathNode = {
    kind: "path",
    id: id("path"),
    name: opts?.name ?? "bezier",
    commands: bezierThrough(points),
    fill: opts?.fill ?? "none",
    stroke: opts?.stroke ?? "#e2e8f0",
    strokeWidth: 2,
  };
  return { ...doc, nodes: [...doc.nodes, node], updatedAt: new Date().toISOString() };
}

export function addLinearGradient(
  doc: DesignDocument,
  stops: Array<{ offset: number; color: string }>
): { doc: DesignDocument; gradientId: string } {
  const gradientId = id("grad");
  const next: DesignDocument = {
    ...doc,
    gradients: [
      ...doc.gradients,
      { id: gradientId, type: "linear", x1: 0, y1: 0, x2: 1, y2: 1, stops },
    ],
    updatedAt: new Date().toISOString(),
  };
  return { doc: next, gradientId };
}

export function defineSymbol(
  doc: DesignDocument,
  name: string,
  children: VectorNode[],
  viewBox = "0 0 64 64"
): { doc: DesignDocument; symbolId: string } {
  const symbolId = id("sym");
  const sym: SymbolDef = { id: symbolId, name, viewBox, children };
  return {
    doc: { ...doc, symbols: [...doc.symbols, sym], updatedAt: new Date().toISOString() },
    symbolId,
  };
}

export function addTextOnPath(
  doc: DesignDocument,
  pathId: string,
  text: string
): DesignDocument {
  const node: VectorNode = {
    kind: "textPath",
    id: id("tp"),
    href: pathId,
    text,
    fill: "#e2e8f0",
    fontSize: 14,
  };
  return { ...doc, nodes: [...doc.nodes, node], updatedAt: new Date().toISOString() };
}

export function exportSvg(doc: DesignDocument): string {
  return documentToSvg(doc);
}

/** Starter design system: tile + wordmark structure */
export function createBrandDesignSystem(brandName: string): DesignDocument {
  let doc = createDocument({ name: `${brandName} System`, width: 512, height: 512 });
  const { doc: d2, gradientId } = addLinearGradient(doc, [
    { offset: 0, color: "#6366f1" },
    { offset: 1, color: "#0a0a0a" },
  ]);
  doc = d2;
  doc = addRect(doc, {
    x: 64,
    y: 64,
    width: 384,
    height: 384,
    rx: 48,
    fill: { gradientId },
    name: "tile",
  });
  const path = bezierThrough([
    { x: 120, y: 280 },
    { x: 200, y: 160 },
    { x: 320, y: 160 },
    { x: 400, y: 280 },
  ]);
  doc = {
    ...doc,
    nodes: [
      ...doc.nodes,
      {
        kind: "path",
        id: id("curve"),
        name: "accent-curve",
        commands: path,
        fill: "none",
        stroke: "#e2e8f0",
        strokeWidth: 3,
      },
      {
        kind: "text",
        id: id("wm"),
        name: "wordmark",
        x: 256,
        y: 300,
        text: brandName,
        fontSize: 28,
        fill: "#f4f4f5",
        fontWeight: 700,
      },
    ],
  };
  const { doc: d3, symbolId } = defineSymbol(doc, "mark", [
    {
      kind: "rect",
      id: id("srect"),
      x: 8,
      y: 8,
      width: 48,
      height: 48,
      rx: 10,
      fill: "#6366f1",
    },
  ]);
  doc = {
    ...d3,
    nodes: [
      ...d3.nodes,
      { kind: "use", id: id("use"), href: symbolId, x: 24, y: 24, width: 48, height: 48 },
    ],
  };
  return doc;
}

export { rectPath };
