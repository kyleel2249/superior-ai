/**
 * AI Council — dynamic specialist agents
 * Executive coordinates; specialists execute; debate engine for hard problems.
 */

import type { AgentDefinition, AgentRole, IntelligenceLevel, TaskType } from "@superior-ai/core";

export const COUNCIL_AGENTS: AgentDefinition[] = [
  {
    id: "executive",
    role: "executive",
    displayName: "Executive Agent",
    description: "Chief coordinator: understands objectives, breaks work into tasks, assigns experts, resolves conflicts, produces final answers.",
    preferredModels: ["gpt-5.6-sol", "claude-opus-5", "grok-4.6"],
    tools: ["task_planner", "memory", "approval"],
    systemPrompt: `You are the Executive Agent of SUPERIOR AI. You coordinate the AI Council.
Understand the user objective precisely. Decompose into clear tasks. Assign the right specialists.
Monitor progress, resolve conflicts between agents, and synthesize the final verified answer.
Never invent execution results. Only report what was actually done.`,
    permissions: ["plan", "delegate", "approve", "finalize"],
  },
  {
    id: "strategist",
    role: "strategist",
    displayName: "Strategist",
    description: "Business strategy, competitive analysis, SWOT, PESTLE, growth and pricing strategy.",
    preferredModels: ["claude-opus-5", "gpt-5.6-sol"],
    tools: ["web_search", "memory"],
    systemPrompt: "You are the Strategist. Produce rigorous strategic analysis with clear frameworks and evidence.",
    permissions: ["research", "analyze"],
  },
  {
    id: "researcher",
    role: "researcher",
    displayName: "Researcher",
    description: "Web, academic, market research; source discovery; fact verification; evidence collection.",
    preferredModels: ["gemini-3.1-pro", "gpt-5.6-sol", "grok-4.6"],
    tools: ["web_search", "browser", "pdf_parser", "memory"],
    systemPrompt: `You are the Researcher. Find high-quality sources. Score by authority, recency, directness, independence.
Never invent sources. Clearly separate verified facts, inferences, estimates, and hypotheses.`,
    permissions: ["search", "extract", "cite"],
  },
  {
    id: "software-architect",
    role: "software-architect",
    displayName: "Software Architect",
    description: "System architecture, infrastructure, databases, APIs, security architecture, scalability.",
    preferredModels: ["gpt-5.6-sol", "claude-opus-5", "gpt-5.3-codex"],
    tools: ["code_runner", "git", "memory"],
    systemPrompt: "You are the Software Architect. Design robust, scalable, secure systems. Prefer clarity and maintainability.",
    permissions: ["design", "review"],
  },
  {
    id: "lead-developer",
    role: "lead-developer",
    displayName: "Lead Developer",
    description: "Coordinates coding team; implements complex features; reviews architecture decisions.",
    preferredModels: ["gpt-5.3-codex", "claude-opus-5", "gpt-5.6-sol"],
    tools: ["code_runner", "terminal", "git", "file_system"],
    systemPrompt: "You are the Lead Developer. Write production-quality code. Prefer tests, clear interfaces, and security.",
    permissions: ["code", "test", "commit"],
  },
  {
    id: "frontend-developer",
    role: "frontend-developer",
    displayName: "Frontend Developer",
    description: "UI/UX implementation, React/Next.js, accessibility, responsive design.",
    preferredModels: ["gpt-5.3-codex", "claude-sonnet-5"],
    tools: ["code_runner", "file_system"],
    systemPrompt: "You are the Frontend Developer. Build polished, accessible, performant interfaces.",
    permissions: ["code"],
  },
  {
    id: "backend-developer",
    role: "backend-developer",
    displayName: "Backend Developer",
    description: "APIs, services, databases, authentication, performance.",
    preferredModels: ["gpt-5.3-codex", "claude-opus-5"],
    tools: ["code_runner", "sql", "terminal"],
    systemPrompt: "You are the Backend Developer. Build secure, well-tested services with clear contracts.",
    permissions: ["code", "db"],
  },
  {
    id: "security-engineer",
    role: "security-engineer",
    displayName: "Security Engineer",
    description: "Application security, threat modeling, dependency scanning, secrets, compliance.",
    preferredModels: ["claude-opus-5", "gpt-5.6-sol"],
    tools: ["code_runner", "secrets_scanner"],
    systemPrompt: "You are the Security Engineer. Identify risks early. Prefer least privilege and defense in depth.",
    permissions: ["audit", "review"],
  },
  {
    id: "qa-engineer",
    role: "qa-engineer",
    displayName: "QA Engineer",
    description: "Test strategy, unit/integration/e2e tests, quality gates.",
    preferredModels: ["gpt-5.3-codex", "claude-sonnet-5"],
    tools: ["code_runner", "terminal"],
    systemPrompt: "You are the QA Engineer. Design and run meaningful tests. Report failures accurately — never invent pass results.",
    permissions: ["test"],
  },
  {
    id: "financial-analyst",
    role: "financial-analyst",
    displayName: "Financial Analyst",
    description: "Financial statements, ratios, forecasting, scenario analysis. Labels output as analytical assistance.",
    preferredModels: ["gpt-5.6-sol", "claude-opus-5"],
    tools: ["spreadsheet", "document_parser"],
    systemPrompt: `You are the Financial Analyst. Analyze statements rigorously. Clearly label analytical assistance vs professional advice.
Never invent financial figures.`,
    permissions: ["analyze"],
  },
  {
    id: "copywriter",
    role: "copywriter",
    displayName: "Copywriter",
    description: "Marketing copy, content strategy, tone-controlled writing.",
    preferredModels: ["claude-fable-5", "claude-sonnet-5", "gpt-5.6-terra"],
    tools: ["memory"],
    systemPrompt: "You are the Copywriter. Match the requested tone and brand voice. Prioritize clarity and conversion where appropriate.",
    permissions: ["write"],
  },
];

export function selectCouncil(
  taskType: TaskType,
  intelligenceLevel: IntelligenceLevel
): AgentDefinition[] {
  const base = [COUNCIL_AGENTS.find((a) => a.role === "executive")!];

  const byType: Partial<Record<TaskType, AgentRole[]>> = {
    coding: ["software-architect", "lead-developer", "frontend-developer", "backend-developer", "qa-engineer", "security-engineer"],
    research: ["researcher", "strategist"],
    financial: ["financial-analyst", "strategist"],
    strategy: ["strategist", "researcher", "financial-analyst"],
    creative: ["copywriter"],
    analysis: ["researcher", "financial-analyst", "strategist"],
    deployment: ["devops" as AgentRole, "security-engineer", "lead-developer"],
  };

  const roles = byType[taskType] ?? ["researcher"];
  for (const role of roles) {
    const agent = COUNCIL_AGENTS.find((a) => a.role === role);
    if (agent && !base.find((b) => b.id === agent.id)) base.push(agent);
  }

  // Scale by intelligence level
  if (intelligenceLevel === "FAST" || intelligenceLevel === "BALANCED") {
    return base.slice(0, 3);
  }
  if (intelligenceLevel === "DEEP" || intelligenceLevel === "EXPERT") {
    return base.slice(0, 6);
  }
  return base; // MAXIMUM / AUTONOMOUS — full relevant council
}

export function buildDebatePrompt(
  agents: AgentDefinition[],
  objective: string,
  mode: "2-agent" | "3-agent" | "5-agent" | "custom" = "3-agent"
): string {
  const selected = agents.slice(0, mode === "2-agent" ? 2 : mode === "3-agent" ? 3 : 5);
  return `AI Council Debate Mode (${mode})
Objective: ${objective}

Participants:
${selected.map((a, i) => `${i + 1}. ${a.displayName} (${a.role})`).join("\n")}

Process:
1. Each participant proposes or critiques in turn.
2. Evidence and risks must be explicit.
3. Executive synthesizes a verified final answer.
Never invent tool results or external facts.`;
}
