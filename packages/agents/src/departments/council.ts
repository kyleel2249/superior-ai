export type DepartmentName =
  | "Executive" | "Growth" | "Engineering" | "Creative" | "Finance" | "Support" | "Research";

export interface AgentDefinition {
  name: string;
  department: DepartmentName;
  mandate: string;
}

export const ALL_DEPARTMENTS: Record<DepartmentName, AgentDefinition[]> = {
  Executive: [{ name: "CEO Agent", department: "Executive", mandate: "Set objective, resolve conflicting recommendations" }],
  Growth: [
    { name: "Research Agent", department: "Growth", mandate: "Market and competitor research" },
    { name: "CMO Agent", department: "Growth", mandate: "Positioning and campaign strategy" },
    { name: "SEO Agent", department: "Growth", mandate: "On-page and technical SEO audits" },
    { name: "Sales Agent", department: "Growth", mandate: "Pipeline and outreach drafting" },
  ],
  Engineering: [
    { name: "CTO Agent", department: "Engineering", mandate: "Technical planning and architecture review" },
    { name: "Coding Agent", department: "Engineering", mandate: "Implementation" },
    { name: "Reviewer Agent", department: "Engineering", mandate: "Code review" },
    { name: "QA Agent", department: "Engineering", mandate: "Test verification" },
  ],
  Creative: [
    { name: "Creative Agent", department: "Creative", mandate: "Scripts and campaign concepts" },
    { name: "Brand Agent", department: "Creative", mandate: "Visual identity" },
  ],
  Finance: [
    { name: "CFO Agent", department: "Finance", mandate: "Budget and cost attribution" },
    { name: "Risk Agent", department: "Finance", mandate: "Flag high-risk spend/actions" },
  ],
  Support: [
    { name: "Support Agent", department: "Support", mandate: "Ticket triage" },
    { name: "Customer Agent", department: "Support", mandate: "Retention playbooks" },
  ],
  Research: [{ name: "Analyst Agent", department: "Research", mandate: "Data synthesis and reporting" }],
};

const TASK_TYPE_DEPARTMENTS: Record<string, DepartmentName[]> = {
  growth_loop: ["Growth", "Creative"],
  campaign_from_oneliner: ["Growth", "Creative", "Executive"],
  software_factory: ["Engineering", "Executive"],
  repo_audit: ["Engineering"],
  budget_review: ["Finance"],
  triage: ["Support"],
  default: ["Executive", "Research"],
};

export function selectAgentsForGrowthTask(taskType: string): AgentDefinition[] {
  const depts = TASK_TYPE_DEPARTMENTS[taskType] ?? TASK_TYPE_DEPARTMENTS.default!;
  return depts.flatMap((d) => ALL_DEPARTMENTS[d]);
}

export function buildCompanyOrgChart() {
  return {
    root: "CEO Agent",
    departments: Object.entries(ALL_DEPARTMENTS).map(([department, agents]) => ({
      department,
      agents: agents.map((a) => a.name),
    })),
  };
}
