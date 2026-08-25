/**
 * Skills system — reusable agent capabilities
 */

export interface Skill {
  id: string;
  name: string;
  description: string;
  tools: string[];
  modelPreference?: string;
  reasoningPreference?: string;
  inputs: string[];
  outputs: string[];
  verification?: string;
}

const SKILLS: Skill[] = [
  {
    id: "skill.financial_analysis",
    name: "Financial analysis",
    description: "Ratio analysis, trends, risk flags from provided statements",
    tools: ["document_tools"],
    modelPreference: "frontier",
    reasoningPreference: "HIGH",
    inputs: ["statements", "period"],
    outputs: ["ratios", "risks", "summary"],
    verification: "multi_model_review",
  },
  {
    id: "skill.web_research",
    name: "Web research",
    description: "Search, collect sources, extract evidence",
    tools: ["web_search", "browser"],
    modelPreference: "search_native",
    reasoningPreference: "MEDIUM",
    inputs: ["query"],
    outputs: ["sources", "evidence", "citations"],
    verification: "source_check",
  },
  {
    id: "skill.software_testing",
    name: "Software testing",
    description: "Plan and run tests, report failures",
    tools: ["code_exec", "repo_inspect"],
    modelPreference: "coding",
    reasoningPreference: "MEDIUM",
    inputs: ["repo", "scope"],
    outputs: ["test_plan", "results", "defects"],
    verification: "ci_gate",
  },
  {
    id: "skill.customer_service",
    name: "Customer service",
    description: "Classify intent, draft replies, escalate policy cases",
    tools: ["memory"],
    modelPreference: "balanced",
    reasoningPreference: "MEDIUM",
    inputs: ["ticket", "crm_context"],
    outputs: ["reply", "tags", "escalation"],
    verification: "policy_check",
  },
  {
    id: "skill.seo",
    name: "SEO",
    description: "Keyword and content structure recommendations",
    tools: ["web_search"],
    modelPreference: "balanced",
    reasoningPreference: "LOW",
    inputs: ["url_or_topic"],
    outputs: ["keywords", "outline", "fixes"],
    verification: "none",
  },
];

export function listSkills(): Skill[] {
  return [...SKILLS];
}

export function getSkill(id: string): Skill | undefined {
  return SKILLS.find((s) => s.id === id);
}

export function composeSkills(skillIds: string[]): {
  id: string;
  skills: Skill[];
  tools: string[];
  name: string;
} {
  const skills = skillIds.map(getSkill).filter(Boolean) as Skill[];
  const tools = [...new Set(skills.flatMap((s) => s.tools))];
  return {
    id: `compose_${skillIds.join("+")}`,
    skills,
    tools,
    name: skills.map((s) => s.name).join(" + ") || "Empty composition",
  };
}

export function generateRoleFromBrief(brief: string): {
  role: string;
  mission: string;
  skills: string[];
  tools: string[];
  kpis: string[];
  approval: string[];
} {
  const lower = brief.toLowerCase();
  const skills: string[] = [];
  if (/finance|revenue|churn|mrr/.test(lower)) skills.push("skill.financial_analysis");
  if (/research|competitor|market/.test(lower)) skills.push("skill.web_research");
  if (/support|ticket|customer/.test(lower)) skills.push("skill.customer_service");
  if (/test|qa|bug/.test(lower)) skills.push("skill.software_testing");
  if (/seo|content|traffic/.test(lower)) skills.push("skill.seo");
  if (!skills.length) skills.push("skill.web_research");

  const composed = composeSkills(skills);
  return {
    role: brief.slice(0, 80) || "Custom AI employee",
    mission: brief,
    skills,
    tools: composed.tools,
    kpis: ["task_success", "quality", "latency"],
    approval: ["external_email", "production_deploy", "refund"],
  };
}
