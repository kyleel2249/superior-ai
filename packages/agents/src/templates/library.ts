/**
 * Agent templates library
 */

export interface AgentTemplate {
  id: string;
  name: string;
  department: string;
  mission: string;
  skills: string[];
  kpis: string[];
  approval: string[];
}

const TEMPLATES: AgentTemplate[] = [
  {
    id: "tpl.sales_rep",
    name: "Sales representative",
    department: "sales",
    mission: "Qualify leads and advance pipeline with human approval on outreach",
    skills: ["skill.web_research", "skill.customer_service"],
    kpis: ["meetings_booked", "pipeline_value"],
    approval: ["external_email"],
  },
  {
    id: "tpl.financial_analyst",
    name: "Financial analyst",
    department: "finance",
    mission: "Analyze statements and flag risks from provided data",
    skills: ["skill.financial_analysis"],
    kpis: ["report_quality", "turnaround"],
    approval: ["external_publish"],
  },
  {
    id: "tpl.support_agent",
    name: "Customer support agent",
    department: "support",
    mission: "Resolve tickets using knowledge and CRM context",
    skills: ["skill.customer_service"],
    kpis: ["csat", "first_response_time"],
    approval: ["refund"],
  },
  {
    id: "tpl.research_analyst",
    name: "Research analyst",
    department: "research",
    mission: "Gather sources and synthesize evidence-backed briefs",
    skills: ["skill.web_research"],
    kpis: ["source_quality", "timeliness"],
    approval: [],
  },
  {
    id: "tpl.software_engineer",
    name: "Software engineer",
    department: "engineering",
    mission: "Implement, test, and document code changes with review gates",
    skills: ["skill.software_testing"],
    kpis: ["pr_quality", "test_pass_rate"],
    approval: ["production_deploy"],
  },
];

export function listAgentTemplates(): AgentTemplate[] {
  return [...TEMPLATES];
}

export function getAgentTemplate(id: string): AgentTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function cloneAgentTemplate(id: string, nameSuffix = " copy"): AgentTemplate | null {
  const t = getAgentTemplate(id);
  if (!t) return null;
  return {
    ...t,
    id: `${t.id}_clone_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    name: t.name + nameSuffix,
  };
}
