import { describe, it, expect } from "vitest";
import { recordEconomics, economicsRollup, listEconomics } from "../ai-economics";
import { computeWorkforcePnL } from "../workforce-pnl";

function uniqueDept(): string {
  return `dept-test-${Math.random().toString(36).slice(2, 10)}`;
}

describe("recordEconomics / economicsRollup", () => {
  it("assigns a unique id and timestamp to every recorded event", () => {
    const dept = uniqueDept();
    const a = recordEconomics({ department: dept, providerCostUsd: 1 });
    const b = recordEconomics({ department: dept, providerCostUsd: 1 });
    expect(a.id).not.toBe(b.id);
    expect(new Date(a.at).toString()).not.toBe("Invalid Date");
  });

  it("rollup sums provider cost and revenue correctly, scoped by department filter", () => {
    const dept = uniqueDept();
    recordEconomics({ department: dept, providerCostUsd: 2.5, revenueInfluencedUsd: 10 });
    recordEconomics({ department: dept, providerCostUsd: 1.25, revenueInfluencedUsd: 5 });

    const rollup = economicsRollup({ department: dept });
    expect(rollup.tasks).toBe(2);
    expect(rollup.providerCostUsd).toBeCloseTo(3.75, 5);
    expect(rollup.revenueInfluencedUsd).toBeCloseTo(15, 5);
  });

  it("avgQuality is null when no event in scope has a qualityScore", () => {
    const dept = uniqueDept();
    recordEconomics({ department: dept, providerCostUsd: 1 });
    expect(economicsRollup({ department: dept }).avgQuality).toBeNull();
  });

  it("avgQuality averages only events that actually have a score, ignoring the rest", () => {
    const dept = uniqueDept();
    recordEconomics({ department: dept, providerCostUsd: 1, qualityScore: 80 });
    recordEconomics({ department: dept, providerCostUsd: 1, qualityScore: 90 });
    recordEconomics({ department: dept, providerCostUsd: 1 }); // no score — must not skew average to 0
    expect(economicsRollup({ department: dept }).avgQuality).toBe(85);
  });

  it("estimatedLaborValueUsd uses the documented $75/hr proxy and says so", () => {
    const dept = uniqueDept();
    recordEconomics({ department: dept, providerCostUsd: 0, humanHoursAvoided: 2 });
    const rollup = economicsRollup({ department: dept });
    expect(rollup.estimatedLaborValueUsd).toBeCloseTo(150, 5);
    expect(rollup.note).toMatch(/\$75\/hr proxy/);
  });

  it("a department filter never leaks another department's events into the rollup", () => {
    const deptA = uniqueDept();
    const deptB = uniqueDept();
    recordEconomics({ department: deptA, providerCostUsd: 100 });
    recordEconomics({ department: deptB, providerCostUsd: 1 });

    expect(economicsRollup({ department: deptB }).providerCostUsd).toBeCloseTo(1, 5);
  });

  it("listEconomics returns newest first", () => {
    const dept = uniqueDept();
    const first = recordEconomics({ department: dept, providerCostUsd: 1 });
    const second = recordEconomics({ department: dept, providerCostUsd: 1 });
    const recent = listEconomics(2);
    expect(recent[0]?.id).toBe(second.id);
    expect(recent.map((r) => r.id)).toContain(first.id);
  });
});

describe("computeWorkforcePnL", () => {
  it("estimatedNetUsd is labor value minus provider cost, and the disclaimer is present", () => {
    const dept = uniqueDept();
    recordEconomics({ department: dept, providerCostUsd: 10, humanHoursAvoided: 1 }); // labor value = 75
    const pnl = computeWorkforcePnL();
    expect(pnl.disclaimer).toMatch(/[Ii]llustrative/);
    expect(pnl.estimatedNetUsd).toBeCloseTo(pnl.estimatedLaborValueUsd - pnl.providerCostUsd, 5);
  });

  it("byDepartment includes a correctly-summed bucket for a freshly recorded department", () => {
    const dept = uniqueDept();
    recordEconomics({ department: dept, providerCostUsd: 3 });
    recordEconomics({ department: dept, providerCostUsd: 4 });

    const pnl = computeWorkforcePnL();
    const bucket = pnl.byDepartment.find((d) => d.department === dept);
    expect(bucket).toBeDefined();
    expect(bucket?.tasks).toBe(2);
    expect(bucket?.cost).toBeCloseTo(7, 5);
  });

  it("events with no department are grouped under 'unassigned'", () => {
    recordEconomics({ providerCostUsd: 1 });
    const pnl = computeWorkforcePnL();
    expect(pnl.byDepartment.some((d) => d.department === "unassigned")).toBe(true);
  });
});
