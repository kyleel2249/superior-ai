import { test, expect } from "@playwright/test";

test.describe("New admin dashboards — page rendering", () => {
  const pages: Array<{ path: string; text: RegExp }> = [
    { path: "/admin/overview", text: /Providers|Foundation|Health/i },
    { path: "/admin/providers", text: /API Keys|Provider health/i },
    { path: "/admin/foundation", text: /Platform Foundation|Feature flags/i },
    { path: "/admin/health", text: /System Health|Self-test/i },
    { path: "/admin/queue", text: /Job Queue/i },
    { path: "/admin/sales", text: /Sales Pipeline/i },
    { path: "/admin/growth", text: /Growth Experiments/i },
    { path: "/admin/search", text: /Search Engines/i },
    { path: "/admin/pnl", text: /Workforce P&L/i },
    { path: "/admin/support", text: /Support Tickets/i },
    { path: "/admin/voc", text: /Voice of Customer/i },
    { path: "/admin/compliance", text: /Compliance Readiness/i },
    { path: "/admin/audit", text: /Audit Log/i },
    { path: "/admin/capabilities", text: /Capabilities/i },
  ];

  for (const { path, text } of pages) {
    test(`${path} loads and renders its heading`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByText(text).first()).toBeVisible();
    });
  }
});

test.describe("Provider API keys — save flow", () => {
  test("saving a key updates credential status without needing a restart", async ({ request }) => {
    const before = await request.get("/api/models");
    expect(before.ok()).toBeTruthy();

    const saveRes = await request.post("/api/models", {
      data: { action: "set_key", provider: "openrouter", key: `sk-or-e2e-test-${Date.now()}` },
    });
    expect(saveRes.ok()).toBeTruthy();
    const saved = await saveRes.json();
    expect(saved.status?.configured).toBe(true);

    const after = await request.get("/api/models");
    const afterData = await after.json();
    const cred = afterData.credentials.find((c: { provider: string }) => c.provider === "openrouter");
    expect(cred.configured).toBe(true);

    // Clean up so repeated CI runs stay idempotent.
    await request.post("/api/models", { data: { action: "delete_key", provider: "openrouter" } });
  });
});

test.describe("Job queue — enqueue and observe", () => {
  test("an enqueued job eventually reaches a terminal state", async ({ request }) => {
    const enqueueRes = await request.post("/api/queue", {
      data: { type: "echo", payload: { e2e: true } },
    });
    expect(enqueueRes.ok()).toBeTruthy();

    let job: { status?: string } | undefined;
    for (let i = 0; i < 20; i++) {
      const snapshot = await request.get("/api/queue");
      const data = await snapshot.json();
      job = data.jobs.find((j: { type: string }) => j.type === "echo");
      if (job?.status === "completed" || job?.status === "failed") break;
      await new Promise((r) => setTimeout(r, 100));
    }
    expect(["completed", "failed"]).toContain(job?.status);
  });
});

test.describe("Sales pipeline — qualification threshold", () => {
  test("a lead only qualifies once both fit and intent clear their thresholds", async ({ request }) => {
    const createRes = await request.post("/api/sales", {
      data: { action: "create_lead", company: `E2E Co ${Date.now()}` },
    });
    const lead = await createRes.json();

    const belowThreshold = await request.post("/api/sales", {
      data: { action: "qualify", leadId: lead.id, fitScore: 80, intentScore: 5 },
    });
    expect((await belowThreshold.json()).status).not.toBe("qualified");

    const aboveThreshold = await request.post("/api/sales", {
      data: { action: "qualify", leadId: lead.id, fitScore: 80, intentScore: 60 },
    });
    expect((await aboveThreshold.json()).status).toBe("qualified");
  });
});

test.describe("Support tickets — auto-escalation", () => {
  test("urgent language auto-escalates the ticket", async ({ request }) => {
    const res = await request.post("/api/support", {
      data: { action: "open", subject: "E2E urgent test", body: "This is urgent, need help immediately" },
    });
    const ticket = await res.json();
    expect(ticket.sentiment).toBe("urgent");
    expect(ticket.status).toBe("escalated");
  });
});

test.describe("Voice of customer — never fabricates NPS/CSAT", () => {
  test("analyzing feedback always returns null NPS/CSAT scores", async ({ request }) => {
    const res = await request.post("/api/cx", {
      data: { action: "voc", texts: ["Too expensive for what we get", "Support was slow to respond"] },
    });
    const report = await res.json();
    expect(report.npsShell.score).toBeNull();
    expect(report.csatShell.score).toBeNull();
  });
});

test.describe("Compliance readiness — honest, never claims certification", () => {
  test("readiness endpoint explicitly disclaims certification", async ({ request }) => {
    const res = await request.get("/api/compliance/readiness");
    const data = await res.json();
    expect(data.note).toMatch(/not.*certification/i);
  });
});
