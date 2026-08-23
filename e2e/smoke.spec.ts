import { test, expect } from "@playwright/test";

test.describe("SUPERIOR AI smoke", () => {
  test("home page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("SUPERIOR AI")).toBeVisible();
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Sign in")).toBeVisible();
  });

  test("health API", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.continuousCapacity).toBe(true);
  });

  test("models API", async ({ request }) => {
    const res = await request.get("/api/models");
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data.models)).toBeTruthy();
  });

  test("dev auth", async ({ request }) => {
    const res = await request.post("/api/auth", {
      data: { email: "e2e@superior.local", role: "owner" },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.token).toBeTruthy();
  });

  test("orchestrate plan", async ({ request }) => {
    const res = await request.post("/api/orchestrate", {
      data: {
        objective: "E2E growth plan for test product",
        product: "TestCRM",
        mode: "execute_safe",
      },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.stages?.length || data.summary).toBeTruthy();
  });
});
