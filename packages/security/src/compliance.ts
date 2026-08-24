/**
 * SOC2 / compliance evidence pack templates — not a certification claim.
 */

export interface ControlTemplate {
  id: string;
  category: "security" | "availability" | "confidentiality" | "privacy" | "processing_integrity";
  name: string;
  description: string;
  evidenceExamples: string[];
  ownerRole: string;
}

export function soc2ControlTemplates(): ControlTemplate[] {
  return [
    {
      id: "CC6.1",
      category: "security",
      name: "Logical access controls",
      description: "Restrict system access to authorized users",
      evidenceExamples: ["RBAC matrix", "Session JWT config", "Access review logs"],
      ownerRole: "admin",
    },
    {
      id: "CC6.6",
      category: "security",
      name: "Encryption & secrets",
      description: "Protect credentials and sensitive data",
      evidenceExamples: [".env.example without secrets", "Secrets not in git", "TLS in production"],
      ownerRole: "admin",
    },
    {
      id: "CC7.2",
      category: "security",
      name: "System monitoring",
      description: "Detect and respond to anomalies",
      evidenceExamples: ["Audit log stream", "Health endpoints", "Rate limits"],
      ownerRole: "ops",
    },
    {
      id: "A1.2",
      category: "availability",
      name: "Backup & recovery",
      description: "Recover from disruption",
      evidenceExamples: ["DB backup policy", "Multi-region failover playbook"],
      ownerRole: "ops",
    },
    {
      id: "C1.1",
      category: "confidentiality",
      name: "Data classification",
      description: "Identify and protect confidential information",
      evidenceExamples: ["Data classification guide", "CRM access roles"],
      ownerRole: "admin",
    },
    {
      id: "P1.1",
      category: "privacy",
      name: "Privacy notice & requests",
      description: "Inform individuals and honor rights requests",
      evidenceExamples: ["Privacy request queue", "Data export/delete procedures"],
      ownerRole: "admin",
    },
    {
      id: "PI1.1",
      category: "processing_integrity",
      name: "Change management",
      description: "Process changes in a controlled manner",
      evidenceExamples: ["PR reviews", "Software factory approval gates", "Deploy checklist"],
      ownerRole: "engineering",
    },
  ];
}

export function evidencePackChecklist(): Array<{ item: string; status: "template" | "implemented" | "ops" }> {
  return [
    { item: "Architecture diagram", status: "template" },
    { item: "Access control policy (RBAC)", status: "implemented" },
    { item: "Audit logging", status: "implemented" },
    { item: "Secrets handling (.env.example)", status: "implemented" },
    { item: "Incident response runbook", status: "template" },
    { item: "Vendor inventory", status: "ops" },
    { item: "Backup verification log", status: "ops" },
    { item: "Privacy request procedure", status: "implemented" },
  ];
}

export function securityHeadersRecommended(): Record<string, string> {
  return {
    "Content-Security-Policy": "default-src 'self'; img-src 'self' data: https:; connect-src 'self' https:",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "X-Frame-Options": "DENY",
  };
}
