import { describe, it, expect } from "vitest";
import { generateLetterformConcepts, exportSvgDataUri } from "../letterform";
import { buildBrandKitPack, exportBrandKitJson } from "../kit-export";
import { brandAssetSpecs } from "../assets";

describe("generateLetterformConcepts", () => {
  it("derives initials from a two-word brand name", () => {
    const system = generateLetterformConcepts({ brandName: "Acme Corp" });
    expect(system.concepts[0]?.initials).toBe("AC");
  });

  it("uses explicit initials when provided, overriding the derived ones", () => {
    const system = generateLetterformConcepts({ brandName: "Acme Corp", initials: "XY" });
    expect(system.concepts[0]?.initials).toBe("XY");
  });

  it("generates one concept per requested style, defaulting to 5 styles", () => {
    const system = generateLetterformConcepts({ brandName: "Test" });
    expect(system.concepts).toHaveLength(5);

    const custom = generateLetterformConcepts({ brandName: "Test", styles: ["bold", "playful"] });
    expect(custom.concepts).toHaveLength(2);
    expect(custom.concepts.map((c) => c.style)).toEqual(["bold", "playful"]);
  });

  it("every generated concept has a unique id, even across multiple calls in the same tick", () => {
    const a = generateLetterformConcepts({ brandName: "A" });
    const b = generateLetterformConcepts({ brandName: "B" });
    const allIds = [...a.concepts.map((c) => c.id), ...b.concepts.map((c) => c.id)];
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it("svgMark is real inline SVG markup, not a fabricated external URL", () => {
    const system = generateLetterformConcepts({ brandName: "Test" });
    for (const c of system.concepts) {
      expect(c.svgMark.trim().startsWith("<?xml") || c.svgMark.includes("<svg")).toBe(true);
      expect(c.svgMark).not.toMatch(/^https?:\/\//);
    }
  });

  it("falls back to 'Brand' when given a blank name", () => {
    const system = generateLetterformConcepts({ brandName: "   " });
    expect(system.brandName).toBe("Brand");
  });
});

describe("exportSvgDataUri", () => {
  it("produces a valid data: URI containing the encoded SVG", () => {
    const uri = exportSvgDataUri("<svg><rect/></svg>");
    expect(uri.startsWith("data:image/svg+xml;utf8,")).toBe(true);
    expect(decodeURIComponent(uri.split(",")[1]!)).toBe("<svg><rect/></svg>");
  });
});

describe("buildBrandKitPack", () => {
  const system = generateLetterformConcepts({ brandName: "Acme Corp", industry: "fintech" });

  it("includes README, tokens.css, system.json, plus one SVG file per concept", () => {
    const pack = buildBrandKitPack(system);
    const paths = pack.files.map((f) => f.path);
    expect(paths).toContain("README.md");
    expect(paths).toContain("tokens.css");
    expect(paths).toContain("system.json");
    const svgFiles = pack.files.filter((f) => f.mime === "image/svg+xml");
    expect(svgFiles.length).toBe(system.concepts.length);
  });

  it("tokens.css includes a CSS variable for every palette color", () => {
    const pack = buildBrandKitPack(system);
    const tokens = pack.files.find((f) => f.path === "tokens.css")!.content;
    for (const p of system.palette) {
      expect(tokens).toContain(p.hex);
    }
  });

  it("manifest fileCount matches the actual number of files, and byte counts are real", () => {
    const pack = buildBrandKitPack(system);
    expect(pack.manifest.fileCount).toBe(pack.files.length);
    const manifestFiles = pack.manifest.files as Array<{ path: string; bytes: number }>;
    for (const mf of manifestFiles) {
      const real = pack.files.find((f) => f.path === mf.path)!;
      expect(mf.bytes).toBe(real.content.length);
    }
  });

  it("system.json round-trips the brand name and concept count", () => {
    const pack = buildBrandKitPack(system);
    const systemJson = pack.files.find((f) => f.path === "system.json")!.content;
    const parsed = JSON.parse(systemJson);
    expect(parsed.brandName).toBe("Acme Corp");
    expect(parsed.concepts).toHaveLength(system.concepts.length);
  });
});

describe("exportBrandKitJson", () => {
  it("produces valid JSON containing both manifest fields and files", () => {
    const system = generateLetterformConcepts({ brandName: "JSON Export Test" });
    const json = exportBrandKitJson(system);
    const parsed = JSON.parse(json);
    expect(parsed.brandName).toBe("JSON Export Test");
    expect(Array.isArray(parsed.files)).toBe(true);
    expect(parsed.files.length).toBeGreaterThan(0);
  });
});

describe("brandAssetSpecs", () => {
  it("returns specs for every major platform with real pixel dimensions", () => {
    const specs = brandAssetSpecs("Acme");
    expect(specs.length).toBeGreaterThan(0);
    for (const s of specs) {
      expect(s.width).toBeGreaterThan(0);
      expect(s.height).toBeGreaterThan(0);
    }
    expect(specs.some((s) => s.platform === "instagram")).toBe(true);
  });

  it("interpolates the brand name into relevant notes", () => {
    const specs = brandAssetSpecs("Northwind");
    const favicon = specs.find((s) => s.name === "favicon");
    expect(favicon?.notes).toContain("Northwind");
  });
});
