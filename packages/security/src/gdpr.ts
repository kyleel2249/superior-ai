/**
 * GDPR operational tools — not legal advice.
 * DSAR, retention, lawful basis registry, processing records (ROPA-lite).
 */

export type LawfulBasis =
  | "consent"
  | "contract"
  | "legal_obligation"
  | "vital_interests"
  | "public_task"
  | "legitimate_interests";

export interface ProcessingActivity {
  id: string;
  name: string;
  purpose: string;
  dataCategories: string[];
  dataSubjects: string[];
  lawfulBasis: LawfulBasis;
  retention: string;
  recipients: string[];
  transfersOutsideEea: boolean;
  securityMeasures: string[];
}

export interface DsarCase {
  id: string;
  subjectRef: string;
  type: "access" | "export" | "erase" | "rectify" | "restrict" | "object" | "portability";
  status: "received" | "identity_pending" | "in_progress" | "fulfilled" | "rejected";
  dueBy: string;
  createdAt: string;
  notes: string[];
  systemsTouched: string[];
}

const ropa: ProcessingActivity[] = [
  {
    id: "proc_accounts",
    name: "Account & authentication",
    purpose: "Provide secure access to the product",
    dataCategories: ["identity", "contact", "auth logs"],
    dataSubjects: ["users"],
    lawfulBasis: "contract",
    retention: "Account life + 30 days",
    recipients: ["hosting provider"],
    transfersOutsideEea: false,
    securityMeasures: ["TLS", "hashed credentials where applicable", "access control"],
  },
  {
    id: "proc_crm",
    name: "CRM / sales pipeline",
    purpose: "Manage customer relationships",
    dataCategories: ["business contact", "company", "notes"],
    dataSubjects: ["prospects", "customers"],
    lawfulBasis: "legitimate_interests",
    retention: "Active relationship + policy window",
    recipients: ["CRM vendor when connected"],
    transfersOutsideEea: false,
    securityMeasures: ["RBAC", "audit log", "encryption at rest when configured"],
  },
  {
    id: "proc_support",
    name: "Support tickets",
    purpose: "Resolve customer issues",
    dataCategories: ["contact", "ticket content"],
    dataSubjects: ["customers"],
    lawfulBasis: "contract",
    retention: "Support policy window",
    recipients: ["support tooling"],
    transfersOutsideEea: false,
    securityMeasures: ["RBAC", "audit"],
  },
];

const dsars: DsarCase[] = [];

export function listProcessingActivities(): ProcessingActivity[] {
  return [...ropa];
}

export function registerProcessingActivity(
  activity: Omit<ProcessingActivity, "id"> & { id?: string }
): ProcessingActivity {
  const row: ProcessingActivity = {
    ...activity,
    id: activity.id ?? `proc_${Date.now().toString(36)}`,
  };
  ropa.push(row);
  return row;
}

export function openDsar(input: {
  subjectRef: string;
  type: DsarCase["type"];
  note?: string;
}): DsarCase {
  const createdAt = new Date();
  const due = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days operational SLA
  const c: DsarCase = {
    id: `dsar_${Date.now().toString(36)}`,
    subjectRef: input.subjectRef,
    type: input.type,
    status: "identity_pending",
    dueBy: due.toISOString(),
    createdAt: createdAt.toISOString(),
    notes: [
      input.note ?? "Verify identity before processing",
      "Do not disclose data to unverified parties",
    ],
    systemsTouched: ["auth", "memory", "crm", "support", "audit"],
  };
  dsars.push(c);
  return c;
}

export function listDsars(): DsarCase[] {
  return [...dsars];
}

export function advanceDsar(
  id: string,
  status: DsarCase["status"],
  note?: string
): DsarCase | null {
  const c = dsars.find((x) => x.id === id);
  if (!c) return null;
  c.status = status;
  if (note) c.notes.push(note);
  return c;
}

/** Data map for erasure planning — systems that may hold subject data */
export function erasurePlan(subjectRef: string): {
  subjectRef: string;
  steps: Array<{ system: string; action: string; requiresApproval: boolean }>;
  note: string;
} {
  return {
    subjectRef,
    steps: [
      { system: "auth/sessions", action: "Revoke sessions for subject accounts", requiresApproval: true },
      { system: "memory", action: "Delete or anonymize memory records tagged to subject", requiresApproval: true },
      { system: "crm", action: "Delete or anonymize contacts/deals when lawful", requiresApproval: true },
      { system: "support", action: "Close tickets + redact PII where required", requiresApproval: true },
      { system: "audit", action: "Retain minimized audit where legally required; else purge", requiresApproval: true },
      { system: "backups", action: "Schedule purge on backup rotation policy", requiresApproval: true },
    ],
    note: "Operational plan only — legal basis and exemptions must be reviewed by a qualified person.",
  };
}

export function consentRecordTemplate(): {
  fields: string[];
  note: string;
} {
  return {
    fields: [
      "subject_id",
      "purpose",
      "timestamp",
      "method",
      "version_of_notice",
      "withdrawn_at",
    ],
    note: "Store consent evidence when relying on consent basis. Not a substitute for a privacy policy.",
  };
}
