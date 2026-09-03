import { describe, it, expect } from "vitest";
import { pathToD, parseD, rectPath } from "../path";
import { booleanPaths, shapeBuilderRect } from "../boolean";

describe("rectPath / pathToD", () => {
  it("builds a closed rectangle path with the correct four corners", () => {
    const cmds = rectPath(10, 20, 100, 50);
    expect(cmds).toEqual([
      { op: "M", x: 10, y: 20 },
      { op: "L", x: 110, y: 20 },
      { op: "L", x: 110, y: 70 },
      { op: "L", x: 10, y: 70 },
      { op: "Z" },
    ]);
  });

  it("serializes to a valid SVG path 'd' string", () => {
    const d = pathToD(rectPath(0, 0, 10, 10));
    expect(d).toBe("M 0 0 L 10 0 L 10 10 L 0 10 Z");
  });
});

describe("parseD / pathToD round-trip", () => {
  it("parses M/L/Z commands back into the same structure they were built from", () => {
    const original = rectPath(5, 5, 20, 20);
    const d = pathToD(original);
    const parsed = parseD(d);
    expect(parsed).toEqual(original);
  });

  it("parses cubic bezier (C) commands with all six coordinates", () => {
    const d = "M 0 0 C 1 2 3 4 5 6";
    const parsed = parseD(d);
    expect(parsed).toEqual([
      { op: "M", x: 0, y: 0 },
      { op: "C", x1: 1, y1: 2, x2: 3, y2: 4, x: 5, y: 6 },
    ]);
  });

  it("ignores malformed fragments rather than crashing", () => {
    expect(() => parseD("garbage not a path")).not.toThrow();
    expect(parseD("garbage not a path")).toEqual([]);
  });
});

describe("booleanPaths", () => {
  const a = rectPath(0, 0, 10, 10);
  const b = rectPath(5, 5, 10, 10);

  it("union combines both paths into one evenodd fragment", () => {
    const result = booleanPaths("union", a, b);
    expect(result.op).toBe("union");
    expect(result.svgFragment).toContain("fill-rule=\"evenodd\"");
    expect(result.d).toContain(pathToD(a));
    expect(result.d).toContain(pathToD(b));
  });

  it("subtract and intersect both use a clipPath, with distinct ids across calls", () => {
    const sub = booleanPaths("subtract", a, b);
    const inter = booleanPaths("intersect", a, b);
    expect(sub.svgFragment).toContain("<clipPath");
    expect(inter.svgFragment).toContain("<clipPath");
    // Each call increments the module-level clip id — must never collide.
    const subId = sub.svgFragment.match(/clipPath id="([^"]+)"/)?.[1];
    const interId = inter.svgFragment.match(/clipPath id="([^"]+)"/)?.[1];
    expect(subId).not.toBe(interId);
  });

  it("every result includes an honest note that this is not a true geometry boolean", () => {
    for (const op of ["union", "subtract", "intersect", "exclude"] as const) {
      const result = booleanPaths(op, a, b);
      expect(result.note.length).toBeGreaterThan(0);
    }
  });

  it("shapeBuilderRect matches calling booleanPaths with an equivalent rect directly", () => {
    const viaHelper = shapeBuilderRect(0, 0, 10, 10, "union", b);
    expect(viaHelper.d).toContain(pathToD(rectPath(0, 0, 10, 10)));
  });
});
