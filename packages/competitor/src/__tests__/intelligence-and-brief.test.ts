import { describe, it, expect } from "vitest";
import { emptyCompetitor, trafficIntelligenceShell, comparisonTemplate } from "../intelligence";
import { buildFeatureComparison } from "../brief";

describe("emptyCompetitor", () => {
  it("starts with every observational field empty — nothing pre-filled/fabricated", () => {
    const c = emptyCompetitor("Acme", "https://acme.com");
    expect(c.products).toEqual([]);
    expect(c.pricingSignals).toEqual([]);
    expect(c.strengths).toEqual([]);
    expect(c.positioning).toBe("");
  });

  it("derives a deterministic id from the name (same name -> same id, by design)", () => {
    const a = emptyCompetitor("Acme Corp", "https://a.example");
    const b = emptyCompetitor("Acme Corp", "https://b.example");
    expect(a.id).toBe(b.id);
    expect(a.id).toBe("comp_acme_corp");
  });
});

describe("trafficIntelligenceShell — never fabricates traffic numbers", () => {
  it("every traffic source is explicitly 'Unknown', not a guessed number", () => {
    const shell = trafficIntelligenceShell("example.com");
    for (const v of Object.values(shell.sources)) {
      expect(v).toMatch(/Unknown/);
    }
  });

  it("has low confidence and Model Inference provenance until real data is integrated", () => {
    const shell = trafficIntelligenceShell("example.com");
    expect(shell.provenance).toBe("Model Inference");
    expect(shell.confidence).toBeLessThan(20);
    expect(shell.note).toMatch(/[Nn]ever fabricate/);
  });
});

describe("comparisonTemplate", () => {
  it("includes both product names and all required comparison sections", () => {
    const t = comparisonTemplate("Us", "Them");
    expect(t).toContain("Us vs Them");
    expect(t).toContain("WHERE THEY WIN:");
    expect(t).toContain("WHERE WE WIN:");
    expect(t).toMatch(/provenance/i);
  });
});

describe("buildFeatureComparison", () => {
  it("marks unobserved dimensions honestly instead of leaving them blank or fabricated", () => {
    const competitor = emptyCompetitor("Rival", "https://rival.example");
    const rows = buildFeatureComparison("OurProduct", [competitor]);
    const core = rows.find((r) => r.dimension === "Core product")!;
    expect(core.them["Rival"]).toBe("Unknown (public)");
    const pricing = rows.find((r) => r.dimension === "Pricing transparency")!;
    expect(pricing.them["Rival"]).toBe("Not observed publicly");
  });

  it("reflects real observed data when the competitor profile has it", () => {
    const competitor = emptyCompetitor("Rival", "https://rival.example");
    competitor.products = ["Widget Pro", "Widget Lite"];
    competitor.pricingSignals = ["$49/mo starter tier"];
    const rows = buildFeatureComparison("OurProduct", [competitor]);
    expect(rows.find((r) => r.dimension === "Core product")?.them["Rival"]).toBe(
      "Widget Pro, Widget Lite"
    );
    expect(rows.find((r) => r.dimension === "Pricing transparency")?.them["Rival"]).toBe(
      "$49/mo starter tier"
    );
  });

  it("uses ourFeatures for the 'us' column when provided, otherwise a placeholder prompt", () => {
    const withFeatures = buildFeatureComparison("Ours", [], ["Feature A", "Feature B"]);
    expect(withFeatures[0]?.us).toBe("Feature A, Feature B");

    const withoutFeatures = buildFeatureComparison("Ours", []);
    expect(withoutFeatures[0]?.us).toContain("fill from product fact sheet");
  });

  it("every row carries an explicit validation gap note, never presented as settled fact", () => {
    const rows = buildFeatureComparison("Ours", [emptyCompetitor("X", "https://x.example")]);
    for (const row of rows) {
      expect(row.gap).toMatch(/[Vv]alidate/);
    }
  });
});
