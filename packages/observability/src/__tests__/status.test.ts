import { describe, it, expect } from "vitest";
import {
  listComponents,
  setComponentStatus,
  overallStatus,
  createIncident,
  updateIncident,
  listIncidents,
  autoProbeFromEnv,
} from "../status";

describe("status aggregation", () => {
  it("ensureDefaults populates the known component set", () => {
    const ids = listComponents().map((c) => c.id);
    expect(ids).toEqual(
      expect.arrayContaining(["api", "web", "workers", "database", "redis", "ai_gateway", "auth"])
    );
  });

  it("overallStatus is operational when every component is operational", () => {
    for (const c of listComponents()) setComponentStatus(c.id, "operational");
    expect(overallStatus()).toBe("operational");
  });

  it("a single outage component escalates overall status to outage", () => {
    setComponentStatus("api", "outage", "test");
    expect(overallStatus()).toBe("outage");
    setComponentStatus("api", "operational"); // restore for later tests
  });

  it("degraded/maintenance (no outage) yields degraded overall, not outage", () => {
    setComponentStatus("redis", "degraded", "test");
    expect(overallStatus()).toBe("degraded");
    setComponentStatus("redis", "operational"); // restore
  });

  it("outage takes priority over a simultaneous degraded component", () => {
    setComponentStatus("redis", "degraded");
    setComponentStatus("api", "outage");
    expect(overallStatus()).toBe("outage");
    setComponentStatus("redis", "operational");
    setComponentStatus("api", "operational");
  });
});

describe("autoProbeFromEnv — honest, no fabricated 'operational' claims", () => {
  it("marks database degraded without DATABASE_URL, operational once it's set", () => {
    const original = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    autoProbeFromEnv();
    expect(listComponents().find((c) => c.id === "database")?.status).toBe("degraded");

    process.env.DATABASE_URL = "postgres://test";
    autoProbeFromEnv();
    expect(listComponents().find((c) => c.id === "database")?.status).toBe("operational");

    if (original === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = original;
    autoProbeFromEnv();
  });

  it("ai_gateway is operational only when at least one real provider key is present", () => {
    const keys = ["OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GOOGLE_AI_API_KEY", "XAI_API_KEY"] as const;
    const originals = keys.map((k) => [k, process.env[k]] as const);
    keys.forEach((k) => delete process.env[k]);

    autoProbeFromEnv();
    expect(listComponents().find((c) => c.id === "ai_gateway")?.status).toBe("degraded");

    process.env.ANTHROPIC_API_KEY = "test-key";
    autoProbeFromEnv();
    expect(listComponents().find((c) => c.id === "ai_gateway")?.status).toBe("operational");

    originals.forEach(([k, v]) => {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    });
    autoProbeFromEnv();
  });
});

describe("incidents", () => {
  it("createIncident starts investigating and defaults impact to degraded", () => {
    const inc = createIncident({ title: "Elevated latency", body: "Investigating a spike" });
    expect(inc.status).toBe("investigating");
    expect(inc.impact).toBe("degraded");
    expect(listIncidents().some((i) => i.id === inc.id)).toBe(true);
  });

  it("updateIncident patches only the given fields, preserving the rest", () => {
    const inc = createIncident({ title: "DB slow", body: "Checking connection pool", impact: "outage" });
    const updated = updateIncident(inc.id, { status: "monitoring" });
    expect(updated?.status).toBe("monitoring");
    expect(updated?.impact).toBe("outage");
    expect(updated?.title).toBe("DB slow");
  });

  it("returns null when updating a nonexistent incident instead of throwing", () => {
    expect(updateIncident("inc_does_not_exist", { status: "resolved" })).toBeNull();
  });

  it("listIncidents returns newest first and respects the limit", () => {
    createIncident({ title: "Incident A", body: "a" });
    createIncident({ title: "Incident B", body: "b" });
    const [first] = listIncidents(1);
    expect(first.title).toBe("Incident B");
    expect(listIncidents(1)).toHaveLength(1);
  });
});
