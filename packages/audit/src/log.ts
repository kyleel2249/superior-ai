export type AuditAction =
  | "auth.login"
  | "auth.logout"
  | "auth.forbidden"
  | "orchestrate.run"
  | "provider.call"
  | "crm.write"
  | "social.publish"
  | "billing.checkout"
  | "billing.webhook"
  | "secrets.encrypt"
  | "admin.config"
  | "tool.execute"
  | "data.export";

export interface AuditEvent {
  id: string;
  at: string;
  action: AuditAction | string;
  actorId?: string;
  actorEmail?: string;
  organizationId?: string;
  resourceType?: string;
  resourceId?: string;
  outcome: "success" | "failure" | "denied";
  ip?: string;
  userAgent?: string;
  meta?: Record<string, unknown>;
  requestId?: string;
}

const MAX = 2000;
const ring: AuditEvent[] = [];

export function audit(input: Omit<AuditEvent, "id" | "at">): AuditEvent {
  const event: AuditEvent = {
    id: `aud_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    ...input,
  };
  ring.push(event);
  if (ring.length > MAX) ring.shift();
  if (process.env.AUDIT_LOG_STDOUT === "1") {
    console.log(JSON.stringify({ type: "audit", ...event }));
  }
  return event;
}

export function listAuditEvents(filter?: {
  organizationId?: string;
  actorId?: string;
  action?: string;
  limit?: number;
}): AuditEvent[] {
  let list = [...ring].reverse();
  if (filter?.organizationId) list = list.filter((e) => e.organizationId === filter.organizationId);
  if (filter?.actorId) list = list.filter((e) => e.actorId === filter.actorId);
  if (filter?.action) list = list.filter((e) => e.action === filter.action || e.action.startsWith(filter.action!));
  return list.slice(0, filter?.limit ?? 100);
}

export function auditStats(): { total: number; byOutcome: Record<string, number> } {
  const byOutcome: Record<string, number> = {};
  for (const e of ring) byOutcome[e.outcome] = (byOutcome[e.outcome] ?? 0) + 1;
  return { total: ring.length, byOutcome };
}
