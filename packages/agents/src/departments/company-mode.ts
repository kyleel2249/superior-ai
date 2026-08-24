/**
 * RUN AS A COMPANY — multi-department collaboration with shared state.
 */

import type { DepartmentId } from "@superior-ai/core";
import {
  ALL_DEPARTMENTS,
  getDepartment,
  selectAgentsForGrowthTask,
  buildCompanyOrgChart,
  type Department,
} from "./full-council";
import { growthLoopPlan } from "../growth-loop";
import { remember, retrieveRelevant, formatMemoryForPrompt } from "@superior-ai/memory";
import { sendAgentMessage } from "../framework/message-bus";
import { createAgentTask, assignTask, completeTask } from "../framework/task-manager";

export interface CompanySharedState {
  objective: string;
  product?: string;
  audience?: string;
  region?: string;
  departmentsEngaged: DepartmentId[];
  decisions: string[];
  artifacts: Array<{ department: string; title: string; summary: string }>;
  memoryKeys: string[];
}

export interface DepartmentContribution {
  departmentId: DepartmentId;
  departmentName: string;
  agentIds: string[];
  recommendation: string;
  risks: string[];
  assumptions: string[];
  expectedOutcome: string;
}

export interface CompanyRunResult {
  mode: "RUN_AS_COMPANY";
  objective: string;
  orgChartPreview: string;
  shared: CompanySharedState;
  contributions: DepartmentContribution[];
  growthPlan: ReturnType<typeof growthLoopPlan>;
  executiveSynthesis: string;
  memoryBlock: string;
  taskIds: string[];
}

const OBJECTIVE_TO_DEPTS: Array<{ re: RegExp; depts: DepartmentId[] }> = [
  { re: /launch|saas|product|mvp/i, depts: ["executive", "strategy", "product" as DepartmentId, "technology", "marketing", "sales", "finance"] },
  { re: /marketing|campaign|brand/i, depts: ["executive", "marketing", "creative", "seo", "sales"] },
  { re: /sales|pipeline|revenue/i, depts: ["executive", "sales", "marketing", "finance", "customer"] },
  { re: /competitor|market/i, depts: ["executive", "strategy", "research", "marketing"] },
  { re: /support|customer|churn/i, depts: ["executive", "customer", "product" as DepartmentId, "operations"] },
  { re: /code|software|engineer/i, depts: ["executive", "technology", "operations"] },
];

function pickDepartments(objective: string): Department[] {
  const ids = new Set<DepartmentId>(["executive"]);
  for (const rule of OBJECTIVE_TO_DEPTS) {
    if (rule.re.test(objective)) {
      for (const d of rule.depts) {
        if (getDepartment(d)) ids.add(d);
      }
    }
  }
  // default company set if only executive
  if (ids.size <= 1) {
    (["strategy", "marketing", "sales", "creative", "technology", "finance", "customer"] as DepartmentId[]).forEach(
      (d) => ids.add(d)
    );
  }
  return [...ids]
    .map((id) => getDepartment(id))
    .filter((d): d is Department => Boolean(d));
}

function departmentBrief(
  dept: Department,
  objective: string,
  shared: CompanySharedState
): DepartmentContribution {
  const lead = dept.agents[0];
  const agentIds = dept.agents.slice(0, 3).map((a) => a.id);
  return {
    departmentId: dept.id,
    departmentName: dept.name,
    agentIds,
    recommendation: `${lead?.displayName ?? dept.name}: For “${objective.slice(0, 100)}”, prioritize ${dept.objectives.slice(0, 2).join(" and ")}. Align with company KPIs: ${dept.kpis.slice(0, 2).join(", ")}.`,
    risks: [
      `Insufficient live data for ${dept.name} — validate before irreversible actions.`,
      shared.region ? `Regional nuance (${shared.region}) may affect ${dept.name} assumptions.` : "Assumptions may not transfer across markets.",
    ],
    assumptions: [
      `Shared product context: ${shared.product ?? "unspecified product"}`,
      `Audience: ${shared.audience ?? "general"}`,
    ],
    expectedOutcome: `Draft ${dept.name} workstream ready for executive synthesis.`,
  };
}

/**
 * Run multi-department collaboration. Does not invent external metrics or contacts.
 */
export async function runAsCompany(input: {
  objective: string;
  product?: string;
  audience?: string;
  region?: string;
}): Promise<CompanyRunResult> {
  const objective = input.objective.trim();
  const depts = pickDepartments(objective);
  const agents = selectAgentsForGrowthTask(objective);

  const shared: CompanySharedState = {
    objective,
    product: input.product,
    audience: input.audience,
    region: input.region,
    departmentsEngaged: depts.map((d) => d.id),
    decisions: [],
    artifacts: [],
    memoryKeys: [],
  };

  // Shared memory seed
  const memKey = `company.objective.${Date.now().toString(36)}`;
  remember({
    type: "project",
    key: memKey,
    content: `RUN AS A COMPANY objective: ${objective}. Product=${input.product ?? "n/a"}; Audience=${input.audience ?? "n/a"}; Region=${input.region ?? "n/a"}`,
    importance: 95,
    tags: ["company", "shared"],
  });
  shared.memoryKeys.push(memKey);

  const contributions: DepartmentContribution[] = [];
  const taskIds: string[] = [];

  for (const dept of depts) {
    const contrib = departmentBrief(dept, objective, shared);
    contributions.push(contrib);
    shared.artifacts.push({
      department: dept.name,
      title: `${dept.name} recommendation`,
      summary: contrib.recommendation,
    });
    shared.decisions.push(`${dept.name}: engage on ${dept.objectives[0]}`);

    const task = createAgentTask({
      title: `${dept.name}: ${objective.slice(0, 60)}`,
      objective: `${dept.name} contribution for: ${objective}`,
      requesterId: "ai-ceo",
      metadata: { departmentId: dept.id },
    });
    const assignee = dept.agents[0]?.id ?? "ai-ceo";
    await assignTask(task.id, assignee);
    await completeTask(task.id, contrib.recommendation);
    taskIds.push(task.id);

    await sendAgentMessage({
      from: "ai-ceo",
      to: assignee,
      type: "task_assign",
      payload: { department: dept.id, objective, contribution: contrib.recommendation },
      correlationId: task.id,
    });

    remember({
      type: "decision",
      content: `[${dept.name}] ${contrib.recommendation}`,
      importance: 75,
      tags: ["company", dept.id],
    });
  }

  const growthPlan = growthLoopPlan(objective);

  const executiveSynthesis = [
    `Executive synthesis for: ${objective}`,
    ``,
    `Departments engaged (${depts.length}): ${depts.map((d) => d.name).join(", ")}`,
    `Agents available for growth task: ${agents.map((a) => a.displayName).join(", ")}`,
    ``,
    ...contributions.map(
      (c) =>
        `### ${c.departmentName}\n${c.recommendation}\nRisks: ${c.risks.join("; ")}\nExpected: ${c.expectedOutcome}`
    ),
    ``,
    `Next: Execute growth loop stages with human approval on publish/spend/external outreach.`,
    `Analytical assistance only — not licensed professional advice.`,
  ].join("\n");

  remember({
    type: "decision",
    key: `company.synthesis.${Date.now().toString(36)}`,
    content: executiveSynthesis.slice(0, 4000),
    importance: 90,
    tags: ["company", "synthesis"],
  });

  const memRecords = retrieveRelevant({ query: objective, limit: 8 });

  return {
    mode: "RUN_AS_COMPANY",
    objective,
    orgChartPreview: buildCompanyOrgChart().slice(0, 3000),
    shared,
    contributions,
    growthPlan,
    executiveSynthesis,
    memoryBlock: formatMemoryForPrompt(memRecords),
    taskIds,
  };
}

export function listCompanyDepartments(): Department[] {
  return ALL_DEPARTMENTS;
}
