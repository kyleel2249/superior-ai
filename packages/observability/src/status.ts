/**
 * Public status aggregation — no secrets, safe for unauthenticated /status
 */

export type ComponentStatus = "operational" | "degraded" | "outage" | "maintenance" | "unknown";

export interface StatusComponent {
  id: string;
  name: string;
  status: ComponentStatus;
  description?: string;
  updatedAt: string;
}

export interface StatusIncident {
  id: string;
  title: string;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  impact: ComponentStatus;
  body: string;
  createdAt: string;
  updatedAt: string;
}

const components = new Map<string, StatusComponent>();
const incidents: StatusIncident[] = [];

function now() {
  return new Date().toISOString();
}

function ensureDefaults() {
  if (components.size > 0) return;
  const defaults: Array<{ id: string; name: string }> = [
    { id: "api", name: "API" },
    { id: "web", name: "Web app" },
    { id: "workers", name: "Background workers" },
    { id: "database", name: "Database" },
    { id: "redis", name: "Queue / Redis" },
    { id: "ai_gateway", name: "AI Gateway" },
    { id: "auth", name: "Authentication" },
  ];
  for (const d of defaults) {
    components.set(d.id, {
      id: d.id,
      name: d.name,
      status: "operational",
      updatedAt: now(),
    });
  }
}

export function setComponentStatus(
  id: string,
  status: ComponentStatus,
  description?: string
): StatusComponent {
  ensureDefaults();
  const existing = components.get(id);
  const row: StatusComponent = {
    id,
    name: existing?.name ?? id,
    status,
    description,
    updatedAt: now(),
  };
  components.set(id, row);
  return row;
}

export function listComponents(): StatusComponent[] {
  ensureDefaults();
  return Array.from(components.values());
}

export function overallStatus(): ComponentStatus {
  const list = listComponents();
  if (list.some((c) => c.status === "outage")) return "outage";
  if (list.some((c) => c.status === "degraded" || c.status === "maintenance")) return "degraded";
  if (list.every((c) => c.status === "operational")) return "operational";
  return "unknown";
}

export function createIncident(input: {
  title: string;
  body: string;
  impact?: ComponentStatus;
}): StatusIncident {
  const incident: StatusIncident = {
    id: `inc_${Date.now().toString(36)}`,
    title: input.title,
    body: input.body,
    status: "investigating",
    impact: input.impact ?? "degraded",
    createdAt: now(),
    updatedAt: now(),
  };
  incidents.unshift(incident);
  return incident;
}

export function updateIncident(
  id: string,
  patch: Partial<Pick<StatusIncident, "title" | "body" | "status" | "impact">>
): StatusIncident | null {
  const i = incidents.find((x) => x.id === id);
  if (!i) return null;
  Object.assign(i, patch, { updatedAt: now() });
  return i;
}

export function listIncidents(limit = 20): StatusIncident[] {
  return incidents.slice(0, limit);
}

/** Probe local signals to refresh component guesses (best-effort, no secrets) */
export function autoProbeFromEnv(): void {
  ensureDefaults();
  if (!process.env.DATABASE_URL) {
    setComponentStatus("database", "degraded", "DATABASE_URL not configured in this process");
  } else {
    setComponentStatus("database", "operational");
  }
  if (!process.env.REDIS_URL) {
    setComponentStatus("redis", "degraded", "REDIS_URL not set — using memory queue");
  } else {
    setComponentStatus("redis", "operational");
  }
  const hasProvider =
    process.env.OPENAI_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.XAI_API_KEY;
  if (!hasProvider) {
    setComponentStatus("ai_gateway", "degraded", "No provider API keys configured");
  } else {
    setComponentStatus("ai_gateway", "operational");
  }
  setComponentStatus("api", "operational");
  setComponentStatus("web", "operational");
  setComponentStatus("auth", "operational");
  setComponentStatus("workers", process.env.SUPERIOR_WORKER === "1" ? "operational" : "operational");
}
