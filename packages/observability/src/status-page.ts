export type ComponentStatus = "operational" | "degraded" | "partial_outage" | "major_outage" | "maintenance";

export interface StatusComponent {
  id: string;
  name: string;
  status: ComponentStatus;
  description?: string;
  updatedAt: string;
}

export interface Incident {
  id: string;
  title: string;
  body: string;
  impact: ComponentStatus;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  createdAt: string;
  updatedAt: string;
}

const components = new Map<string, StatusComponent>([
  ["openrouter", { id: "openrouter", name: "Model Gateway (OpenRouter)", status: "maintenance", description: "Not yet validated", updatedAt: new Date().toISOString() }],
  ["database", { id: "database", name: "Database", status: "maintenance", description: "DATABASE_URL not set", updatedAt: new Date().toISOString() }],
  ["billing", { id: "billing", name: "Billing (Stripe)", status: "maintenance", description: "STRIPE_SECRET_KEY not set", updatedAt: new Date().toISOString() }],
]);

const incidents = new Map<string, Incident>();

export function listComponents(): StatusComponent[] {
  return Array.from(components.values());
}

export function setComponentStatus(id: string, status: ComponentStatus, description?: string): StatusComponent {
  const existing = components.get(id);
  const comp: StatusComponent = { id, name: existing?.name ?? id, status, description: description ?? existing?.description, updatedAt: new Date().toISOString() };
  components.set(id, comp);
  return comp;
}

export function overallStatus(): ComponentStatus {
  const all = listComponents();
  if (all.some((c) => c.status === "major_outage")) return "major_outage";
  if (all.some((c) => c.status === "partial_outage")) return "partial_outage";
  if (all.some((c) => c.status === "degraded")) return "degraded";
  if (all.some((c) => c.status === "maintenance")) return "maintenance";
  return "operational";
}

export function createIncident(input: { title: string; body: string; impact?: ComponentStatus }): Incident {
  const now = new Date().toISOString();
  const incident: Incident = {
    id: `inc_${Date.now().toString(36)}`,
    title: input.title,
    body: input.body,
    impact: input.impact ?? "degraded",
    status: "investigating",
    createdAt: now,
    updatedAt: now,
  };
  incidents.set(incident.id, incident);
  return incident;
}

export function updateIncident(id: string, patch: Partial<Pick<Incident, "status" | "body" | "impact">>): Incident | undefined {
  const inc = incidents.get(id);
  if (!inc) return undefined;
  Object.assign(inc, patch, { updatedAt: new Date().toISOString() });
  return inc;
}

export function listIncidents(limit = 10): Incident[] {
  return Array.from(incidents.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

/** Honestly reflects real env config — not a fabricated "everything is green" status. */
export function autoProbeFromEnv(): void {
  setComponentStatus("openrouter", process.env.OPENROUTER_API_KEY ? "operational" : "maintenance", process.env.OPENROUTER_API_KEY ? "Key configured (see /api/health for live validation)" : "OPENROUTER_API_KEY not set");
  setComponentStatus("database", process.env.DATABASE_URL ? "operational" : "maintenance", process.env.DATABASE_URL ? "Configured" : "DATABASE_URL not set — using in-memory fallback");
  setComponentStatus("billing", process.env.STRIPE_SECRET_KEY ? "operational" : "maintenance", process.env.STRIPE_SECRET_KEY ? "Configured" : "STRIPE_SECRET_KEY not set");
}
