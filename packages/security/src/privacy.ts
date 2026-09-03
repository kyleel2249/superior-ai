/**
 * Privacy & data handling policies (operational, not legal advice).
 */

export type DataClass = "public" | "internal" | "confidential" | "restricted";

export interface DataHandlingRule {
  class: DataClass;
  examples: string[];
  storage: string;
  retention: string;
  sharing: string;
}

export function dataClassificationGuide(): DataHandlingRule[] {
  return [
    {
      class: "public",
      examples: ["Marketing copy", "Public docs"],
      storage: "CDN / public buckets",
      retention: "As needed for product",
      sharing: "Public",
    },
    {
      class: "internal",
      examples: ["Aggregated metrics", "Internal briefs"],
      storage: "App DB with access control",
      retention: "Business need",
      sharing: "Authenticated roles",
    },
    {
      class: "confidential",
      examples: ["Customer emails", "CRM notes", "support tickets"],
      storage: "Encrypted at rest when configured",
      retention: "Policy-defined; support export/delete",
      sharing: "Need-to-know + audit",
    },
    {
      class: "restricted",
      examples: ["API keys", "tokens", "credentials"],
      storage: "Secrets manager / env — never logs",
      retention: "Rotate regularly",
      sharing: "No human export in plain text via UI without admin",
    },
  ];
}

export function privacyRequestTypes(): string[] {
  return ["access", "export", "delete", "rectify", "restrict_processing"];
}

export interface PrivacyRequest {
  id: string;
  type: string;
  subjectRef: string;
  status: "received" | "in_progress" | "completed" | "rejected";
  createdAt: string;
  notes: string[];
}

const privacyQueue: PrivacyRequest[] = [];

export function openPrivacyRequest(input: {
  type: string;
  subjectRef: string;
  note?: string;
}): PrivacyRequest {
  const req: PrivacyRequest = {
    id: `prv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    type: input.type,
    subjectRef: input.subjectRef,
    status: "received",
    createdAt: new Date().toISOString(),
    notes: [input.note ?? "Received — verify identity before fulfilling"],
  };
  privacyQueue.push(req);
  return req;
}

export function listPrivacyRequests(): PrivacyRequest[] {
  return [...privacyQueue];
}
