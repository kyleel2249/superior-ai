import { describe, it, expect } from "vitest";
import { developConcept, listConcepts, investmentCases } from "../pipeline";

describe("developConcept", () => {
  it("every score is within 0-100 and revenuePotential/risk are averages of their inputs", () => {
    const c = developConcept({ idea: "A simple scheduling tool" });
    for (const v of Object.values(c.scores)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
    expect(c.scores.revenuePotential).toBe(Math.round((c.scores.opportunity + c.scores.demand) / 2));
    expect(c.scores.risk).toBe(Math.round((c.scores.competition + c.scores.executionDifficulty) / 2));
  });

  it("mentioning 'AI' in the idea raises the competition score", () => {
    const withAi = developConcept({ idea: "AI-powered scheduling assistant" });
    const withoutAi = developConcept({ idea: "Manual scheduling assistant tool" });
    expect(withAi.scores.competition).toBeGreaterThan(withoutAi.scores.competition);
  });

  it("mentioning 'platform' raises execution difficulty", () => {
    const platform = developConcept({ idea: "A multi-sided platform for X" });
    const simple = developConcept({ idea: "A simple app for X" });
    expect(platform.scores.executionDifficulty).toBeGreaterThan(simple.scores.executionDifficulty);
  });

  it("always attaches the non-guarantee disclaimer", () => {
    const c = developConcept({ idea: "Anything" });
    expect(c.disclaimer).toMatch(/not guarantees/i);
  });

  it("fills in sensible defaults when customerProblem/targetMarket are omitted", () => {
    const c = developConcept({ idea: "Widget tracker" });
    expect(c.customerProblem).toContain("Widget tracker");
    expect(c.targetMarket).toMatch(/refined/i);
  });

  it("registers the concept so listConcepts() can find it, newest first", () => {
    const a = developConcept({ idea: "First idea" });
    const b = developConcept({ idea: "Second idea" });
    const [top] = listConcepts();
    expect(top.id).toBe(b.id);
    expect(listConcepts().map((c) => c.id)).toContain(a.id);
  });
});

describe("investmentCases", () => {
  it("returns null for a concept id that doesn't exist", () => {
    expect(investmentCases("prod_nonexistent")).toBeNull();
  });

  it("recommends proceeding only when opportunity >= 60 and risk < 70", () => {
    // Long idea string pushes opportunity toward the higher end; check
    // recommendation is consistent with the concept's own computed scores
    // rather than asserting a specific hardcoded outcome.
    const c = developConcept({ idea: "A focused productivity tool for remote teams" });
    const cases = investmentCases(c.id)!;
    const shouldProceed = c.scores.opportunity >= 60 && c.scores.risk < 70;
    expect(cases.recommendation).toBe(
      shouldProceed
        ? "Proceed to validated pilot with clear kill criteria"
        : "Research further before material build investment"
    );
  });

  it("always includes the non-advice disclaimer and standard risk/assumption lists", () => {
    const c = developConcept({ idea: "Test idea for disclaimers" });
    const cases = investmentCases(c.id)!;
    expect(cases.disclaimer).toMatch(/[Nn]ot investment, legal, or financial advice/);
    expect(cases.keyRisks.length).toBeGreaterThan(0);
    expect(cases.keyAssumptions.length).toBeGreaterThan(0);
  });

  it("the bull case references the concept's own revenuePotential score, not a fabricated number", () => {
    const c = developConcept({ idea: "Referenced score test" });
    const cases = investmentCases(c.id)!;
    expect(cases.bull).toContain(String(c.scores.revenuePotential));
  });
});
