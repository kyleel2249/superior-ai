import { describe, it, expect } from "vitest";
import { analyzeVoc, retentionPlaybook } from "../voc";

describe("analyzeVoc — theme detection", () => {
  it("buckets feedback into the right theme by keyword", () => {
    const report = analyzeVoc([
      "The pricing is too expensive for what we get",
      "App crashed twice today, very buggy",
      "So easy to use, love the interface",
    ]);
    const themeNames = report.themes.map((t) => t.theme);
    expect(themeNames).toContain("pricing");
    expect(themeNames).toContain("reliability");
    expect(themeNames).toContain("ease of use");
  });

  it("a single piece of feedback can match multiple themes at once", () => {
    const report = analyzeVoc(["The support response was slow and the onboarding was confusing"]);
    const themeNames = report.themes.map((t) => t.theme);
    expect(themeNames).toContain("support experience");
    expect(themeNames).toContain("performance");
    expect(themeNames).toContain("onboarding");
  });

  it("falls back to 'general' for text matching no theme rule", () => {
    const report = analyzeVoc(["The weather was nice today"]);
    expect(report.themes.map((t) => t.theme)).toContain("general");
  });

  it("ignores blank/whitespace-only entries in sampleSize and buckets", () => {
    const report = analyzeVoc(["", "   ", "Real feedback about pricing being too costly"]);
    expect(report.sampleSize).toBe(1);
  });

  it("caps stored examples per theme at 3, but count keeps incrementing past that", () => {
    const texts = Array.from({ length: 5 }, (_, i) => `Too expensive, billing issue #${i}`);
    const report = analyzeVoc(texts);
    const pricing = report.themes.find((t) => t.theme === "pricing")!;
    expect(pricing.count).toBe(5);
    expect(pricing.examples.length).toBe(3);
  });

  it("themes are sorted by count descending", () => {
    const report = analyzeVoc([
      "expensive pricing", "expensive pricing", "expensive pricing",
      "buggy crash",
    ]);
    expect(report.themes[0]?.theme).toBe("pricing");
    expect(report.themes[0]?.count).toBeGreaterThanOrEqual(report.themes[1]?.count ?? 0);
  });

  it("attaches product/marketing implications only to specific themes, not all", () => {
    const report = analyzeVoc(["missing a feature we really need", "love how simple it is"]);
    const featureGaps = report.themes.find((t) => t.theme === "feature gaps");
    const easeOfUse = report.themes.find((t) => t.theme === "ease of use");
    expect(featureGaps?.productImplication).toBeDefined();
    expect(easeOfUse?.marketingImplication).toBeDefined();
    expect(featureGaps?.marketingImplication).toBeUndefined();
  });
});

describe("analyzeVoc — never fabricates quantitative scores", () => {
  it("npsShell and csatShell are always null with an honest explanatory note", () => {
    const report = analyzeVoc(["Great product, love it, so easy to use"]);
    expect(report.npsShell.score).toBeNull();
    expect(report.npsShell.note).toMatch(/survey/i);
    expect(report.csatShell.score).toBeNull();
    expect(report.csatShell.note).toMatch(/not fabricated/i);
  });

  it("retentionRisks only lists negative-sentiment themes, opportunities only positive", () => {
    const report = analyzeVoc(["Too expensive", "So easy to use and helpful"]);
    expect(report.retentionRisks.some((r) => r.includes("pricing"))).toBe(true);
    expect(report.opportunities.some((o) => o.includes("ease of use"))).toBe(true);
    expect(report.retentionRisks.some((r) => r.includes("ease of use"))).toBe(false);
  });
});

describe("retentionPlaybook", () => {
  it("returns the four standard lifecycle stages with actions, and an honesty note", () => {
    const playbook = retentionPlaybook("Acme Suite");
    expect(playbook.stages.map((s) => s.name)).toEqual(["Activation", "Adoption", "Expansion", "Save"]);
    expect(playbook.stages[0]?.actions[0]).toContain("Acme Suite");
    expect(playbook.note).toMatch(/analytics/i);
  });
});
