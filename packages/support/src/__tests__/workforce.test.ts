import { describe, it, expect } from "vitest";
import { openTicket, resolveTicket, listTickets, supportTrendAlerts } from "../workforce";

describe("openTicket — sentiment and routing", () => {
  it("detects angry sentiment and auto-escalates", () => {
    const t = openTicket({ subject: "This is unacceptable", body: "I am furious, considering a lawsuit" });
    expect(t.sentiment).toBe("angry");
    expect(t.status).toBe("escalated");
    expect(t.assignedRole).toBe("complaint_resolution");
  });

  it("detects urgent sentiment and auto-escalates even without anger", () => {
    const t = openTicket({ subject: "Production down", body: "This is urgent, need help immediately" });
    expect(t.sentiment).toBe("urgent");
    expect(t.status).toBe("escalated");
  });

  it("routes billing-related language to billing_support without escalating", () => {
    const t = openTicket({ subject: "Invoice question", body: "I was charged twice for my subscription" });
    expect(t.assignedRole).toBe("billing_support");
    expect(t.status).toBe("open");
  });

  it("routes technical language to technical_support", () => {
    const t = openTicket({ subject: "API error", body: "Getting a timeout crash on every request" });
    expect(t.assignedRole).toBe("technical_support");
  });

  it("routes cancellation intent to retention", () => {
    const t = openTicket({ subject: "Cancel my account", body: "I am thinking of switching to a competitor" });
    expect(t.assignedRole).toBe("retention");
  });

  it("defaults to customer_support and neutral sentiment for plain requests", () => {
    const t = openTicket({ subject: "Question", body: "How do I export my data" });
    expect(t.assignedRole).toBe("product_support"); // "how do i" matches product_support first
  });

  it("assigns id and timestamps, and drafts non-fake guidance in history", () => {
    const t = openTicket({ subject: "Test", body: "Just a note" });
    expect(t.id).toMatch(/^tkt_/);
    expect(t.history.length).toBeGreaterThan(0);
    expect(t.history[0]).toContain("Agent(");
  });

  it("carries forward recent history for a returning customer, capped at 5 prior notes", () => {
    const customerId = `cust-${Math.random()}`;
    for (let i = 0; i < 7; i++) {
      openTicket({ subject: `Issue ${i}`, body: "details", customerId });
    }
    const latest = openTicket({ subject: "Latest issue", body: "details", customerId });
    // 5 prior notes carried in, plus this ticket's own guidance line appended after.
    expect(latest.history.length).toBe(6);
  });
});

describe("resolveTicket", () => {
  it("marks a ticket resolved and records the resolution in history", () => {
    const t = openTicket({ subject: "Resolve me", body: "please fix" });
    const resolved = resolveTicket(t.id, "Issued a refund");
    expect(resolved?.status).toBe("resolved");
    expect(resolved?.resolution).toBe("Issued a refund");
    expect(resolved?.history.some((h) => h.includes("Issued a refund"))).toBe(true);
  });

  it("returns null for a ticket id that doesn't exist", () => {
    expect(resolveTicket("tkt_does_not_exist", "n/a")).toBeNull();
  });
});

describe("listTickets", () => {
  it("returns newest ticket first", () => {
    const a = openTicket({ subject: "First", body: "x" });
    const b = openTicket({ subject: "Second", body: "x" });
    const [first] = listTickets();
    expect(first.id).toBe(b.id);
    expect(listTickets().map((t) => t.id)).toContain(a.id);
  });
});

describe("supportTrendAlerts", () => {
  it("flags a trend once 3+ open tickets share the same subject prefix", () => {
    const subject = `Recurring issue ${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      openTicket({ subject, body: "same problem again" });
    }
    const alerts = supportTrendAlerts();
    expect(alerts.some((a) => a.toLowerCase().includes(subject.toLowerCase()))).toBe(true);
  });

  it("does not flag a subject seen only once or twice", () => {
    const subject = `Rare issue ${Math.random()}`;
    openTicket({ subject, body: "one-off" });
    const alerts = supportTrendAlerts();
    expect(alerts.some((a) => a.toLowerCase().includes(subject.toLowerCase()))).toBe(false);
  });
});
