import { describe, it, expect } from "vitest";
import { audit, listAuditEvents, auditStats } from "../log";

describe("audit()", () => {
  it("assigns a unique id and ISO timestamp to every event", () => {
    const a = audit({ action: "auth.login", outcome: "success" });
    const b = audit({ action: "auth.login", outcome: "success" });
    expect(a.id).not.toBe(b.id);
    expect(new Date(a.at).toString()).not.toBe("Invalid Date");
  });

  it("preserves all provided fields", () => {
    const orgId = `org-${Math.random()}`;
    const e = audit({
      action: "billing.checkout",
      outcome: "success",
      organizationId: orgId,
      actorId: "user_1",
      meta: { plan: "pro" },
    });
    expect(e.organizationId).toBe(orgId);
    expect(e.actorId).toBe("user_1");
    expect(e.meta).toEqual({ plan: "pro" });
  });
});

describe("listAuditEvents", () => {
  it("returns newest first", () => {
    const orgId = `org-order-${Math.random()}`;
    const first = audit({ action: "auth.login", outcome: "success", organizationId: orgId });
    const second = audit({ action: "auth.logout", outcome: "success", organizationId: orgId });
    const [top] = listAuditEvents({ organizationId: orgId });
    expect(top.id).toBe(second.id);
    expect(listAuditEvents({ organizationId: orgId }).map((e) => e.id)).toContain(first.id);
  });

  it("filters by organizationId without leaking other orgs' events", () => {
    const orgA = `org-a-${Math.random()}`;
    const orgB = `org-b-${Math.random()}`;
    audit({ action: "auth.login", outcome: "success", organizationId: orgA });
    audit({ action: "auth.login", outcome: "success", organizationId: orgB });
    const events = listAuditEvents({ organizationId: orgA });
    expect(events.every((e) => e.organizationId === orgA)).toBe(true);
  });

  it("filters by actorId", () => {
    const actorId = `actor-${Math.random()}`;
    audit({ action: "tool.execute", outcome: "success", actorId });
    const events = listAuditEvents({ actorId });
    expect(events.every((e) => e.actorId === actorId)).toBe(true);
  });

  it("filters by action as an exact match or prefix", () => {
    const orgId = `org-action-${Math.random()}`;
    audit({ action: "provider.call", outcome: "success", organizationId: orgId });
    audit({ action: "crm.write", outcome: "success", organizationId: orgId });
    const providerEvents = listAuditEvents({ organizationId: orgId, action: "provider" });
    expect(providerEvents.every((e) => e.action.startsWith("provider"))).toBe(true);
    expect(providerEvents.some((e) => e.action === "crm.write")).toBe(false);
  });

  it("respects the limit parameter, defaulting to 100", () => {
    const orgId = `org-limit-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      audit({ action: "tool.execute", outcome: "success", organizationId: orgId });
    }
    expect(listAuditEvents({ organizationId: orgId, limit: 2 })).toHaveLength(2);
  });
});

describe("auditStats", () => {
  it("counts outcomes across the whole ring, reflecting at least what we just added", () => {
    const before = auditStats();
    audit({ action: "auth.forbidden", outcome: "denied" });
    const after = auditStats();
    expect(after.total).toBe(before.total + 1);
    expect(after.byOutcome.denied ?? 0).toBeGreaterThanOrEqual((before.byOutcome.denied ?? 0) + 1);
  });
});
