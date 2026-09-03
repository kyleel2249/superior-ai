import { describe, it, expect, beforeEach } from "vitest";
import {
  recordUsage,
  setBudget,
  getBudget,
  budgetStatus,
  summarizeUsage,
  estimateTokenCost,
} from "../meters";

// meters.ts uses module-level in-memory state, so give every org a unique id
// per test to avoid cross-test bleed rather than trying to reset internals.
let orgCounter = 0;
function freshOrgId() {
  orgCounter += 1;
  return `org_test_${orgCounter}`;
}

describe("estimateTokenCost", () => {
  it("uses the default rate for unknown/omitted model ids", () => {
    const cost = estimateTokenCost(1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(2.5 + 10, 5);
  });

  it("uses model-specific rates when known", () => {
    const cost = estimateTokenCost(1_000_000, 0, "claude-opus-5");
    expect(cost).toBeCloseTo(5, 5);
  });

  it("scales linearly with token count", () => {
    const small = estimateTokenCost(1000, 1000, "gpt-5.6-luna");
    const big = estimateTokenCost(10_000, 10_000, "gpt-5.6-luna");
    expect(big).toBeCloseTo(small * 10, 6);
  });

  it("returns 0 for zero tokens", () => {
    expect(estimateTokenCost(0, 0)).toBe(0);
  });
});

describe("budget + usage metering", () => {
  it("budgetStatus is inert (no alert/blocked) when no budget is set", () => {
    const org = freshOrgId();
    const status = budgetStatus(org);
    expect(status.budget).toBeUndefined();
    expect(status.alert).toBe(false);
    expect(status.blocked).toBe(false);
  });

  it("recordUsage accumulates spend against the org's budget", () => {
    const org = freshOrgId();
    setBudget({ organizationId: org, monthlyLimitUsd: 10 });
    recordUsage({ organizationId: org, meter: "tokens", quantity: 1000, costUsd: 3 });
    recordUsage({ organizationId: org, meter: "tokens", quantity: 1000, costUsd: 2 });
    const budget = getBudget(org)!;
    expect(budget.currentSpendUsd).toBeCloseTo(5, 6);
  });

  it("budgetStatus reports alert once spend crosses the alert threshold", () => {
    const org = freshOrgId();
    setBudget({ organizationId: org, monthlyLimitUsd: 10, alertThreshold: 0.5 });
    recordUsage({ organizationId: org, meter: "tokens", quantity: 1, costUsd: 4.9 });
    expect(budgetStatus(org).alert).toBe(false);
    recordUsage({ organizationId: org, meter: "tokens", quantity: 1, costUsd: 0.2 });
    expect(budgetStatus(org).alert).toBe(true);
  });

  it("hard-stop budgets block new usage once the limit is reached", () => {
    const org = freshOrgId();
    setBudget({ organizationId: org, monthlyLimitUsd: 5, hardStop: true });
    recordUsage({ organizationId: org, meter: "tokens", quantity: 1, costUsd: 5 });
    expect(budgetStatus(org).blocked).toBe(true);

    const result = recordUsage({ organizationId: org, meter: "tokens", quantity: 1, costUsd: 1 });
    expect(result).toMatchObject({ blocked: true });
    expect((result as { reason: string }).reason).toMatch(/hard budget limit/);
  });

  it("non-hard-stop budgets never block, even far over limit", () => {
    const org = freshOrgId();
    setBudget({ organizationId: org, monthlyLimitUsd: 1, hardStop: false });
    recordUsage({ organizationId: org, meter: "tokens", quantity: 1, costUsd: 100 });
    const result = recordUsage({ organizationId: org, meter: "tokens", quantity: 1, costUsd: 1 });
    expect(result).not.toMatchObject({ blocked: true });
    expect(budgetStatus(org).blocked).toBe(false);
  });

  it("summarizeUsage aggregates quantity and cost per meter, scoped to the org", () => {
    const orgA = freshOrgId();
    const orgB = freshOrgId();
    recordUsage({ organizationId: orgA, meter: "tokens", quantity: 100, costUsd: 1 });
    recordUsage({ organizationId: orgA, meter: "tokens", quantity: 200, costUsd: 2 });
    recordUsage({ organizationId: orgA, meter: "images", quantity: 1, costUsd: 0.5 });
    recordUsage({ organizationId: orgB, meter: "tokens", quantity: 9999, costUsd: 99 });

    const summary = summarizeUsage({ organizationId: orgA });
    expect(summary.tokens).toEqual({ quantity: 300, costUsd: 3 });
    expect(summary.images).toEqual({ quantity: 1, costUsd: 0.5 });
    expect(summary.tokens).not.toMatchObject({ quantity: 9999 + 300 });
  });
});
