/**
 * Serialize design document to SVG.
 */

import type { DesignDocument, Paint, VectorNode } from "./types";
import { pathToD } from "./path";

function paintAttr(p: Paint | undefined, attr: "fill" | "stroke"): string {
  if (!p) return attr === "fill" ? 'fill="none"' : "";
  if (typeof p === "string") return `${attr}="${p}"`;
  return `${attr}="url(#${p.gradientId})"`;
}

function nodeSvg(n: VectorNode): string {
  const common = [
    paintAttr(n.fill, "fill"),
    paintAttr(n.stroke, "stroke"),
    n.strokeWidth != null ? `stroke-width="${n.strokeWidth}"` : "",
    n.opacity != null ? `opacity="${n.opacity}"` : "",
    n.transform ? `transform="${n.transform}"` : "",
    n.name ? `data-name="${n.name}"` : "",
    `id="${n.id}"`,
  ]
    .filter(Boolean)
    .join(" ");

  switch (n.kind) {
    case "path":
      return `<path d="${pathToD(n.commands)}" ${common} />`;
    case "rect":
      return `<rect x="${n.x}" y="${n.y}" width="${n.width}" height="${n.height}" ${n.rx != null ? `rx="${n.rx}"` : ""} ${common} />`;
    case "ellipse":
      return `<ellipse cx="${n.cx}" cy="${n.cy}" rx="${n.rx}" ry="${n.ry}" ${common} />`;
    case "text":
      return `<text x="${n.x}" y="${n.y}" font-size="${n.fontSize ?? 16}" font-family="${n.fontFamily ?? "system-ui,sans-serif"}" font-weight="${n.fontWeight ?? 600}" ${common}>${escapeXml(n.text)}</text>`;
    case "textPath":
      return `<text ${common}><textPath href="#${n.href}" font-size="${n.fontSize ?? 16}" font-family="${n.fontFamily ?? "system-ui,sans-serif"}">${escapeXml(n.text)}</textPath></text>`;
    case "use":
      return `<use href="#${n.href}" x="${n.x ?? 0}" y="${n.y ?? 0}" ${n.width != null ? `width="${n.width}"` : ""} ${n.height != null ? `height="${n.height}"` : ""} ${common} />`;
  }
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function documentToSvg(doc: DesignDocument): string {
  const defs: string[] = [];
  for (const g of doc.gradients) {
    if (g.type === "linear") {
      const stops = g.stops.map((s) => `<stop offset="${s.offset}" stop-color="${s.color}" />`).join("");
      defs.push(
        `<linearGradient id="${g.id}" x1="${g.x1}" y1="${g.y1}" x2="${g.x2}" y2="${g.y2}">${stops}</linearGradient>`
      );
    } else {
      const stops = g.stops.map((s) => `<stop offset="${s.offset}" stop-color="${s.color}" />`).join("");
      defs.push(
        `<radialGradient id="${g.id}" cx="${g.cx}" cy="${g.cy}" r="${g.r}">${stops}</radialGradient>`
      );
    }
  }
  for (const p of doc.patterns) {
    defs.push(
      `<pattern id="${p.id}" width="${p.width}" height="${p.height}" patternUnits="userSpaceOnUse">${p.contentSvg}</pattern>`
    );
  }
  for (const sym of doc.symbols) {
    defs.push(
      `<symbol id="${sym.id}" viewBox="${sym.viewBox}">${sym.children.map(nodeSvg).join("")}</symbol>`
    );
  }

  const body = doc.nodes.map(nodeSvg).join("\n  ");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${doc.width}" height="${doc.height}" viewBox="0 0 ${doc.width} ${doc.height}" role="img">
  <defs>
    ${defs.join("\n    ")}
  </defs>
  ${body}
</svg>`;
}
