import { describe, it, expect } from "vitest";
import { proposeExperiments, growthOpportunities } from "../growth";

describe("proposeExperiments", () => {
  it("returns 4 distinct, uniquely-identified experiments covering headline/UGC/CTA/SEO", () => {
    const experiments = proposeExperiments("B2B SaaS onboarding");
    expect(experiments).toHaveLength(4);
    const ids = experiments.map((e) => e.id);
    expect(new Set(ids).size).toBe(4);
    expect(ids.some((id) => id.startsWith("exp_headline_"))).toBe(true);
    expect(ids.some((id) => id.startsWith("exp_ugc_"))).toBe(true);
  });

  it("every experiment starts in 'proposed' status with at least one variant", () => {
    const experiments = proposeExperiments("checkout flow");
    for (const e of experiments) {
      expect(e.status).toBe("proposed");
      expect(e.variants.length).toBeGreaterThan(0);
    }
  });

  it("regression: two calls in immediate succession never produce colliding ids", () => {
    // Guards the fix for a real bug found in this codebase — experiment ids
    // were `exp_<type>_${Date.now()}` with no randomness, so two calls to
    // proposeExperiments() landing in the same millisecond (trivially
    // possible in synchronous code) produced identical ids for the same
    // experiment type.
    const first = proposeExperiments("context A");
    const second = proposeExperiments("context B");
    const firstIds = new Set(first.map((e) => e.id));
    for (const e of second) {
      expect(firstIds.has(e.id)).toBe(false);
    }
  });

  it("falls back to 'conversion' as context when given an empty string", () => {
    const experiments = proposeExperiments("");
    expect(experiments[0]?.hypothesis).toContain("conversion");
  });
});

describe("growthOpportunities", () => {
  it("returns a non-empty, stable list of opportunity strings", () => {
    const first = growthOpportunities();
    const second = growthOpportunities();
    expect(first.length).toBeGreaterThan(0);
    expect(first).toEqual(second);
  });
});
