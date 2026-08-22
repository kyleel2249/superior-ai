import { test, expect } from "@playwright/test";

test.describe("Command center flows", () => {
  test("studio page", async ({ page }) => {
    await page.goto("/studio");
    await expect(page.getByText(/studio|creative|campaign/i).first()).toBeVisible();
  });

  test("sales page", async ({ page }) => {
    await page.goto("/sales");
    await expect(page.getByText(/sales|lead|pipeline/i).first()).toBeVisible();
  });

  test("campaign API", async ({ request }) => {
    const res = await request.post("/api/campaigns", {
      data: {
        objective: "30s UGC ad for CRM targeting SMBs in Ghana",
        product: "SuperiorCRM",
        audience: "small businesses in Ghana",
      },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("billing budget", async ({ request }) => {
    const res = await request.post("/api/billing", {
      data: { action: "set_budget", organizationId: "org_e2e", monthlyLimitUsd: 50, hardStop: true },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("JWT session cookie", async ({ request }) => {
    const res = await request.post("/api/auth", {
      data: { email: "cookie@superior.local", role: "admin" },
    });
    expect(res.ok()).toBeTruthy();
    const setCookie = res.headers()["set-cookie"] || "";
    expect(setCookie.toLowerCase()).toContain("superior_session");
  });
});
