/**
 * Boolean operations — simplified path combination for SVG export.
 * True geometric boolean needs a polygon clip library; we provide union/intersect/subtract markup strategies.
 */

import { pathToD, rectPath } from "./path";
import type { PathCommand } from "./types";

export type BooleanOp = "union" | "intersect" | "subtract" | "exclude";

export interface BooleanResult {
  op: BooleanOp;
  /** SVG path d for simple cases; composite uses mask/clip */
  d?: string;
  svgFragment: string;
  note: string;
}

let clipId = 0;

export function booleanPaths(
  op: BooleanOp,
  a: PathCommand[],
  b: PathCommand[]
): BooleanResult {
  const da = pathToD(a);
  const db = pathToD(b);
  clipId += 1;
  const id = `clip_${clipId}`;

  if (op === "union") {
    return {
      op,
      d: `${da} ${db}`,
      svgFragment: `<path d="${da} ${db}" fill-rule="evenodd" />`,
      note: "Union as combined path (evenodd). For production CAD-grade boolean, plug a geometry engine.",
    };
  }
  if (op === "subtract") {
    return {
      op,
      svgFragment: `<defs><clipPath id="${id}"><path d="${da}"/></clipPath></defs><path d="${db}" clip-path="url(#${id})" />`,
      note: "Subtract approximated via clipPath. Prefer a geometry boolean library for exact results.",
    };
  }
  if (op === "intersect") {
    return {
      op,
      svgFragment: `<defs><clipPath id="${id}"><path d="${da}"/></clipPath></defs><path d="${db}" clip-path="url(#${id})" />`,
      note: "Intersect approximated via clipPath.",
    };
  }
  // exclude
  return {
    op,
    d: `${da} ${db}`,
    svgFragment: `<path d="${da} ${db}" fill-rule="evenodd" />`,
    note: "Exclude via evenodd compound path.",
  };
}

export function shapeBuilderRect(
  x: number,
  y: number,
  w: number,
  h: number,
  op: BooleanOp,
  other: PathCommand[]
): BooleanResult {
  return booleanPaths(op, rectPath(x, y, w, h), other);
}
