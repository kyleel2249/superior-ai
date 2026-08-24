/**
 * Marketing automation workflows — approval-gated external actions.
 */

export type WorkflowStatus = "draft" | "scheduled" | "awaiting_approval" | "running" | "paused" | "completed";

export interface WorkflowStep {
  id: string;
  name: string;
  channel: "email" | "social" | "ads" | "seo" | "crm" | "internal";
  action: string;
  requiresApproval: boolean;
  status: "pending" | "approved" | "done" | "skipped";
}

export interface MarketingWorkflow {
  id: string;
  name: string;
  objective: string;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
}

const workflows = new Map<string, MarketingWorkflow>();

function sid() {
  return `wf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function createNurtureWorkflow(product: string, audience: string): MarketingWorkflow {
  const id = sid();
  const wf: MarketingWorkflow = {
    id,
    name: `Nurture · ${product}`,
    objective: `Nurture ${audience} toward activation of ${product}`,
    status: "draft",
    steps: [
      { id: "s1", name: "Welcome email", channel: "email", action: "send_template_welcome", requiresApproval: true, status: "pending" },
      { id: "s2", name: "Educational content", channel: "email", action: "send_guide", requiresApproval: true, status: "pending" },
      { id: "s3", name: "Social proof", channel: "email", action: "send_case_pattern", requiresApproval: true, status: "pending" },
      { id: "s4", name: "CTA demo", channel: "email", action: "send_demo_invite", requiresApproval: true, status: "pending" },
      { id: "s5", name: "CRM status sync", channel: "crm", action: "update_lead_stage", requiresApproval: false, status: "pending" },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  workflows.set(id, wf);
  return wf;
}

export function createLaunchWorkflow(product: string): MarketingWorkflow {
  const id = sid();
  const wf: MarketingWorkflow = {
    id,
    name: `Launch · ${product}`,
    objective: `Coordinate launch assets for ${product}`,
    status: "draft",
    steps: [
      { id: "s1", name: "SEO pillar publish", channel: "seo", action: "publish_pillar", requiresApproval: true, status: "pending" },
      { id: "s2", name: "Social calendar week", channel: "social", action: "schedule_week", requiresApproval: true, status: "pending" },
      { id: "s3", name: "Ad creative pack", channel: "ads", action: "upload_creatives", requiresApproval: true, status: "pending" },
      { id: "s4", name: "Email announcement", channel: "email", action: "send_announce", requiresApproval: true, status: "pending" },
      { id: "s5", name: "Measure baseline", channel: "internal", action: "snapshot_metrics", requiresApproval: false, status: "pending" },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  workflows.set(id, wf);
  return wf;
}

export function listWorkflows(): MarketingWorkflow[] {
  return [...workflows.values()];
}

export function getWorkflow(id: string): MarketingWorkflow | null {
  return workflows.get(id) ?? null;
}

export function approveWorkflowStep(workflowId: string, stepId: string): MarketingWorkflow | null {
  const wf = workflows.get(workflowId);
  if (!wf) return null;
  const step = wf.steps.find((s) => s.id === stepId);
  if (!step) return null;
  step.status = "approved";
  wf.status = "awaiting_approval";
  if (wf.steps.every((s) => !s.requiresApproval || s.status === "approved" || s.status === "done")) {
    wf.status = "running";
  }
  wf.updatedAt = new Date().toISOString();
  return wf;
}

export function advanceWorkflow(workflowId: string): MarketingWorkflow | null {
  const wf = workflows.get(workflowId);
  if (!wf) return null;
  for (const step of wf.steps) {
    if (step.status === "pending") {
      if (step.requiresApproval) {
        wf.status = "awaiting_approval";
        wf.updatedAt = new Date().toISOString();
        return wf;
      }
      step.status = "done";
      break;
    }
    if (step.status === "approved") {
      step.status = "done";
      break;
    }
  }
  if (wf.steps.every((s) => s.status === "done" || s.status === "skipped")) {
    wf.status = "completed";
  } else if (wf.status !== "awaiting_approval") {
    wf.status = "running";
  }
  wf.updatedAt = new Date().toISOString();
  return wf;
}

export function emailSequenceTemplates(product: string): Array<{ day: number; subject: string; purpose: string }> {
  return [
    { day: 0, subject: `Welcome — getting value from ${product}`, purpose: "Activate" },
    { day: 2, subject: `One workflow teams love in ${product}`, purpose: "Educate" },
    { day: 5, subject: `Avoid this common setup mistake`, purpose: "Prevent churn" },
    { day: 9, subject: `Ready for a quick walkthrough?`, purpose: "Convert" },
  ];
}
