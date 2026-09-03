import { describe, it, expect } from "vitest";
import { predictCreativePerformance, generateVariations } from "../performance";

describe("predictCreativePerformance", () => {
  it("scores a strong hook+CTA+pain script higher than a flat one with none of those", () => {
    const strong = predictCreativePerformance({
      script: "Stop losing leads to manual follow-ups — start your free trial today",
      style: "ugc",
    });
    const flat = predictCreativePerformance({ script: "our product exists", style: "studio_commercial" });
    expect(strong.creativeConfidence).toBeGreaterThan(flat.creativeConfidence);
    expect(strong.hookStrength).toBeGreaterThan(flat.hookStrength);
    expect(strong.ctaStrength).toBeGreaterThan(flat.ctaStrength);
  });

  it("ugc/social_native styles get a higher attentionPotential than other styles", () => {
    const ugc = predictCreativePerformance({ script: "test script here", style: "ugc" });
    const studio = predictCreativePerformance({ script: "test script here", style: "studio_commercial" });
    expect(ugc.attentionPotential).toBeGreaterThan(studio.attentionPotential);
  });

  it("creativeConfidence never exceeds 85, even for a maximally strong script", () => {
    const best = predictCreativePerformance({
      script: "Stop wasting time, imagine never missing a lead again — book a demo now before you lose more revenue",
      style: "ugc",
    });
    expect(best.creativeConfidence).toBeLessThanOrEqual(85);
  });

  it("purchaseIntent is the average of offer, cta, and emotion scores", () => {
    const p = predictCreativePerformance({ script: "start your free trial and stop the struggle", style: "ugc" });
    expect(p.purchaseIntent).toBe(Math.round((p.offerStrength + p.ctaStrength + p.emotionalAppeal) / 3));
  });

  it("always attaches the non-guarantee disclaimer", () => {
    const p = predictCreativePerformance({ script: "anything" });
    expect(p.disclaimer).toMatch(/not guaranteed/i);
  });

  it("handles a missing script gracefully without throwing", () => {
    expect(() => predictCreativePerformance({})).not.toThrow();
  });
});

describe("generateVariations", () => {
  it("returns the requested count of variations, each with a distinct angle", () => {
    const variations = generateVariations("base script", 5);
    expect(variations).toHaveLength(5);
    expect(new Set(variations.map((v) => v.angle)).size).toBe(5);
  });

  it("defaults to 10 variations when count is omitted", () => {
    expect(generateVariations("base script")).toHaveLength(10);
  });

  it("caps at the number of available angles even if a larger count is requested", () => {
    expect(generateVariations("base script", 999).length).toBeLessThanOrEqual(10);
  });

  it("every variation's script embeds the original base script", () => {
    const variations = generateVariations("Hook: test. CTA: buy now.", 3);
    for (const v of variations) {
      expect(v.script).toContain("Hook: test. CTA: buy now.");
    }
  });
});
