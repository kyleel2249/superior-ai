/**
 * apps/web/src/app/api/status/route.ts imports autoProbeFromEnv, listComponents,
 * overallStatus, listIncidents, setComponentStatus, createIncident,
 * updateIncident, and type ComponentStatus from "@superior-ai/observability" —
 * but observability/src/index.ts only re-exported ./tracing and ./rate-limit.
 * This status/incident module didn't exist under any filename. Added here and
 * wired into index.ts.
 */

import { cacheBackendHint } from "@superior-ai/cache";
import { storageBackendHint } from "@superior-ai/storage";
import { queueBackendHint } from "@superior-ai/queue";

export type ComponentStatus = "operational" | "degraded" | "outage" | "unknown";

export interface Component {
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
  impact: "minor" | "major" | "critical";
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

const components = new Map<string, Component>([
  ["api", { id: "api", name: "API", status: "operational", updatedAt: new Date().toISOString() }],
  ["database", { id: "database", name: "Database", status: "unknown", updatedAt: new Date().toISOString() }],
  ["ai_providers", { id: "ai_providers", name: "AI Providers", status: "unknown", updatedAt: new Date().toISOString() }],
  ["cache", { id: "cache", name: "Cache", status: "unknown", updatedAt: new Date().toISOString() }],
  ["object_storage", { id: "object_storage", name: "Object Storage", status: "unknown", updatedAt: new Date().toISOString() }],
  ["queue", { id: "queue", name: "Job Queue", status: "unknown", updatedAt: new Date().toISOString() }],
]);

const incidents: Incident[] = [];

/** Lightweight env-based probe — does not call out to provider APIs (that's ai-gateway's job). */
export function autoProbeFromEnv(): void {
  setComponentStatus("database", process.env.DATABASE_URL ? "operational" : "unknown", process.env.DATABASE_URL ? undefined : "DATABASE_URL not set");
  const anyProviderKey = [
    process.env.OPENAI_API_KEY,
    process.env.ANTHROPIC_API_KEY,
    process.env.XAI_API_KEY,
    process.env.GOOGLE_AI_API_KEY,
    process.env.OPENROUTER_API_KEY,
  ].some(Boolean);
  setComponentStatus("ai_providers", anyProviderKey ? "operational" : "unknown", anyProviderKey ? undefined : "No provider API keys configured");
  setComponentStatus(
    "cache",
    "operational",
    cacheBackendHint() === "redis" ? "Redis configured (REDIS_URL)" : "In-memory fallback — REDIS_URL not set, cache does not persist across restarts"
  );
  setComponentStatus(
    "object_storage",
    "operational",
    storageBackendHint() === "s3" ? "S3-compatible bucket configured (AWS_S3_BUCKET)" : "Local filesystem fallback — AWS_S3_BUCKET not set, storage is local to this instance"
  );
  setComponentStatus(
    "queue",
    "operational",
    queueBackendHint() === "redis" ? "Redis-backed job store configured (REDIS_URL)" : "In-memory fallback — REDIS_URL not set, queued jobs do not survive a restart"
  );
}

export function listComponents(): Component[] {
  return Array.from(components.values());
}

export function overallStatus(): ComponentStatus {
  const statuses = listComponents().map((c) => c.status);
  if (statuses.includes("outage")) return "outage";
  if (statuses.includes("degraded")) return "degraded";
  if (statuses.every((s) => s === "operational")) return "operational";
  return "unknown";
}

export function setComponentStatus(id: string, status: ComponentStatus, description?: string): Component {
  const existing = components.get(id);
  const component: Component = {
    id,
    name: existing?.name ?? id,
    status,
    description,
    updatedAt: new Date().toISOString(),
  };
  components.set(id, component);
  return component;
}

export function listIncidents(limit = 10): Incident[] {
  return incidents.slice(-limit).reverse();
}

export function createIncident(input: { title: string; body: string; impact?: Incident["impact"] }): Incident {
  const now = new Date().toISOString();
  const incident: Incident = {
    id: `inc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    title: input.title,
    body: input.body,
    impact: input.impact ?? "minor",
    createdAt: now,
    updatedAt: now,
  };
  incidents.push(incident);
  return incident;
}

export function updateIncident(id: string, patch: Partial<Pick<Incident, "title" | "body" | "impact" | "resolvedAt">>): Incident | undefined {
  const incident = incidents.find((i) => i.id === id);
  if (!incident) return undefined;
  Object.assign(incident, patch, { updatedAt: new Date().toISOString() });
  return incident;
}
