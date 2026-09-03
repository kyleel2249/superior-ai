import { describe, it, expect } from "vitest";
import { createCrmConnector, listCrmProviders } from "../connectors";

describe("createCrmConnector — unconfigured paths never fabricate success", () => {
  it("hubspot without credentials returns requiresConfig, no network call", async () => {
    const connector = createCrmConnector({ provider: "hubspot" });
    const result = await connector.testConnection();
    expect(result.success).toBe(false);
    expect(result.requiresConfig).toBe(true);
    expect(result.error).toMatch(/not configured/i);
  });

  it("hubspot upsertContact refuses a contact with no email rather than inventing one", async () => {
    const connector = createCrmConnector({ provider: "hubspot", accessToken: "fake-token-for-validation-test" });
    const result = await connector.upsertContact({ firstName: "No", lastName: "Email" });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/email required/i);
  });

  it("salesforce/zoho/pipedrive/custom always return a stub 'not configured' result regardless of input", async () => {
    for (const provider of ["salesforce", "zoho", "pipedrive", "custom"] as const) {
      const connector = createCrmConnector({ provider, accessToken: "even-with-a-token" });
      const result = await connector.testConnection();
      expect(result.success).toBe(false);
      expect(result.requiresConfig).toBe(true);
    }
  });
});

describe("listCrmProviders", () => {
  it("regression: never reports 'configured' for a provider that only resolves to a stub connector", () => {
    const original = process.env.SALESFORCE_ACCESS_TOKEN;
    process.env.SALESFORCE_ACCESS_TOKEN = "a-real-looking-token";
    const providers = listCrmProviders();
    const salesforce = providers.find((p) => p.id === "salesforce")!;
    // Even with an env token present, the status must not claim
    // "configured" since createCrmConnector("salesforce") always returns
    // StubConnector, which always fails — claiming "configured" here would
    // be exactly the kind of fabrication this project's design forbids.
    expect(salesforce.status).not.toBe("configured");
    if (original === undefined) delete process.env.SALESFORCE_ACCESS_TOKEN;
    else process.env.SALESFORCE_ACCESS_TOKEN = original;
  });

  it("hubspot is the only provider whose status can legitimately say 'configured'", () => {
    const original = process.env.HUBSPOT_ACCESS_TOKEN;
    process.env.HUBSPOT_ACCESS_TOKEN = "a-real-looking-token";
    const providers = listCrmProviders();
    expect(providers.find((p) => p.id === "hubspot")?.status).toBe("configured");
    if (original === undefined) delete process.env.HUBSPOT_ACCESS_TOKEN;
    else process.env.HUBSPOT_ACCESS_TOKEN = original;
  });

  it("lists all five known providers", () => {
    const ids = listCrmProviders().map((p) => p.id);
    expect(ids.sort()).toEqual(["custom", "hubspot", "pipedrive", "salesforce", "zoho"].sort());
  });
});
