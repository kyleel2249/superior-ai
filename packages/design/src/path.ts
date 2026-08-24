/**
 * Path builders — pen / bezier / nodes.
 */

import type { PathCommand, Vec2 } from "./types";

export function pathToD(commands: PathCommand[]): string {
  return commands
    .map((c) => {
      switch (c.op) {
        case "M":
          return `M ${c.x} ${c.y}`;
        case "L":
          return `L ${c.x} ${c.y}`;
        case "C":
          return `C ${c.x1} ${c.y1} ${c.x2} ${c.y2} ${c.x} ${c.y}`;
        case "Q":
          return `Q ${c.x1} ${c.y1} ${c.x} ${c.y}`;
        case "Z":
          return "Z";
      }
    })
    .join(" ");
}

export function parseD(d: string): PathCommand[] {
  const cmds: PathCommand[] = [];
  const re = /([MLCQZmlcqz])([^MLCQZmlcqz]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(d)) !== null) {
    const op = m[1]!.toUpperCase();
    const nums = (m[2]!.match(/-?\d*\.?\d+/g) || []).map(Number);
    if (op === "M" && nums.length >= 2) cmds.push({ op: "M", x: nums[0]!, y: nums[1]! });
    else if (op === "L" && nums.length >= 2) cmds.push({ op: "L", x: nums[0]!, y: nums[1]! });
    else if (op === "C" && nums.length >= 6)
      cmds.push({
        op: "C",
        x1: nums[0]!,
        y1: nums[1]!,
        x2: nums[2]!,
        y2: nums[3]!,
        x: nums[4]!,
        y: nums[5]!,
      });
    else if (op === "Q" && nums.length >= 4)
      cmds.push({ op: "Q", x1: nums[0]!, y1: nums[1]!, x: nums[2]!, y: nums[3]! });
    else if (op === "Z") cmds.push({ op: "Z" });
  }
  return cmds;
}

/** Approximate cubic bezier through points (simple fan-out, not full smoother). */
export function bezierThrough(points: Vec2[]): PathCommand[] {
  if (points.length === 0) return [];
  const cmds: PathCommand[] = [{ op: "M", x: points[0]!.x, y: points[0]!.y }];
  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1]!;
    const p1 = points[i]!;
    const dx = (p1.x - p0.x) / 3;
    const dy = (p1.y - p0.y) / 3;
    cmds.push({
      op: "C",
      x1: p0.x + dx,
      y1: p0.y + dy,
      x2: p1.x - dx,
      y2: p1.y - dy,
      x: p1.x,
      y: p1.y,
    });
  }
  return cmds;
}

export function rectPath(x: number, y: number, w: number, h: number): PathCommand[] {
  return [
    { op: "M", x, y },
    { op: "L", x: x + w, y },
    { op: "L", x: x + w, y: y + h },
    { op: "L", x, y: y + h },
    { op: "Z" },
  ];
}
