/**
 * SLA engine, priority queues, incident manager — lightweight in-process.
 */

export type Priority = "P0" | "P1" | "P2" | "P3" | "P4";

export interface SlaPolicy {
  id: string;
  name: string;
  responseMinutes: number;
  completionMinutes: number;
  qualityMin: number;
}

export interface QueueItem {
  id: string;
  tenantId: string;
  priority: Priority;
  payload: string;
  enqueuedAt: string;
  status: "queued" | "running" | "done" | "failed" | "dead";
}

export interface Incident {
  id: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "detected" | "contained" | "recovering" | "resolved";
  body: string;
  createdAt: string;
  updatedAt: string;
}

const defaultSlas: SlaPolicy[] = [
  { id: "sla_std", name: "Standard", responseMinutes: 60, completionMinutes: 1440, qualityMin: 70 },
  { id: "sla_crit", name: "Critical", responseMinutes: 5, completionMinutes: 60, qualityMin: 85 },
];

const queues: QueueItem[] = [];
const incidents: Incident[] = [];

const PRIORITY_RANK: Record<Priority, number> = {
  P0: 0,
  P1: 1,
  P2: 2,
  P3: 3,
  P4: 4,
};

export function listSlaPolicies(): SlaPolicy[] {
  return [...defaultSlas];
}

export function enqueueTask(input: {
  tenantId?: string;
  priority?: Priority;
  payload: string;
}): QueueItem {
  const item: QueueItem = {
    id: `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    tenantId: input.tenantId ?? "local",
    priority: input.priority ?? "P3",
    payload: input.payload,
    enqueuedAt: new Date().toISOString(),
    status: "queued",
  };
  queues.push(item);
  return item;
}

export function dequeueNext(tenantId?: string): QueueItem | null {
  const candidates = queues
    .filter((q) => q.status === "queued" && (!tenantId || q.tenantId === tenantId))
    .sort(
      (a, b) =>
        PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
        a.enqueuedAt.localeCompare(b.enqueuedAt)
    );
  const next = candidates[0];
  if (!next) return null;
  next.status = "running";
  return next;
}

export function completeTask(id: string, ok = true): QueueItem | null {
  const item = queues.find((q) => q.id === id);
  if (!item) return null;
  item.status = ok ? "done" : "failed";
  return item;
}

export function listQueue(status?: QueueItem["status"]): QueueItem[] {
  return status ? queues.filter((q) => q.status === status) : [...queues];
}

export function openIncident(input: {
  title: string;
  severity?: Incident["severity"];
  body: string;
}): Incident {
  const now = new Date().toISOString();
  const inc: Incident = {
    id: `inc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    title: input.title,
    severity: input.severity ?? "medium",
    status: "detected",
    body: input.body,
    createdAt: now,
    updatedAt: now,
  };
  incidents.push(inc);
  return inc;
}

export function advanceIncident(
  id: string,
  status: Incident["status"]
): Incident | null {
  const inc = incidents.find((i) => i.id === id);
  if (!inc) return null;
  inc.status = status;
  inc.updatedAt = new Date().toISOString();
  return inc;
}

export function listIncidents(): Incident[] {
  return [...incidents].reverse();
}
