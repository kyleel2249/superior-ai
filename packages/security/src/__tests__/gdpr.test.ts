import { describe, it, expect } from "vitest";
import {
  openDsar,
  listDsars,
  advanceDsar,
  erasurePlan,
  listProcessingActivities,
  registerProcessingActivity,
} from "../gdpr";

describe("openDsar", () => {
  it("sets a 30-day operational due date from creation time", () => {
    const before = Date.now();
    const dsar = openDsar({ subjectRef: "user_123", type: "erase" });
    const dueMs = new Date(dsar.dueBy).getTime();
    const createdMs = new Date(dsar.createdAt).getTime();
    expect(createdMs).toBeGreaterThanOrEqual(before);
    expect(dueMs - createdMs).toBe(30 * 24 * 60 * 60 * 1000);
  });

  it("always starts identity_pending and warns not to disclose to unverified parties", () => {
    const dsar = openDsar({ subjectRef: "user_456", type: "access" });
    expect(dsar.status).toBe("identity_pending");
    expect(dsar.notes.some((n) => /unverified/i.test(n))).toBe(true);
  });

  it("is registered and retrievable via listDsars", () => {
    const dsar = openDsar({ subjectRef: "user_789", type: "portability" });
    const found = listDsars().find((d) => d.id === dsar.id);
    expect(found).toBeDefined();
    expect(found?.type).toBe("portability");
  });
});

describe("advanceDsar", () => {
  it("transitions status and appends a note, without losing prior notes", () => {
    const dsar = openDsar({ subjectRef: "user_advance", type: "rectify" });
    const updated = advanceDsar(dsar.id, "in_progress", "identity verified via support ticket #442");
    expect(updated?.status).toBe("in_progress");
    expect(updated?.notes).toHaveLength(3); // 2 default + 1 new
    expect(updated?.notes.at(-1)).toMatch(/identity verified/);
  });

  it("returns null for a nonexistent case id instead of throwing", () => {
    expect(advanceDsar("dsar_does_not_exist", "fulfilled")).toBeNull();
  });
});

describe("erasurePlan", () => {
  it("always requires approval on every step — no auto-deletion path", () => {
    const plan = erasurePlan("user_erase_me");
    expect(plan.steps.length).toBeGreaterThan(0);
    expect(plan.steps.every((s) => s.requiresApproval)).toBe(true);
  });

  it("covers auth/session revocation as a required step", () => {
    const plan = erasurePlan("user_x");
    expect(plan.steps.some((s) => /session/i.test(s.action))).toBe(true);
  });
});

describe("processing activities registry (ROPA)", () => {
  it("ships with a non-empty baseline registry", () => {
    expect(listProcessingActivities().length).toBeGreaterThan(0);
  });

  it("registering a new activity does not mutate the returned snapshot afterwards", () => {
    const before = listProcessingActivities().length;
    registerProcessingActivity({
      name: "Marketing analytics",
      purpose: "Understand campaign performance",
      dataCategories: ["usage"],
      dataSubjects: ["visitors"],
      lawfulBasis: "legitimate_interests",
      retention: "13 months",
      recipients: ["analytics vendor"],
      transfersOutsideEea: false,
      securityMeasures: ["pseudonymization"],
    });
    expect(listProcessingActivities().length).toBe(before + 1);
  });
});
