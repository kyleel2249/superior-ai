/**
 * FULL BUSINESS EXPERT COUNCIL
 * Interconnected departments sharing memory, CRM, analytics, campaigns.
 * Analytical assistance only — not licensed professional advice.
 */

import type { AgentDefinition, AgentRole, DepartmentId } from "@superior-ai/core";

export interface Department {
  id: DepartmentId;
  name: string;
  objectives: string[];
  kpis: string[];
  agents: AgentDefinition[];
}

const base = (
  id: string,
  role: AgentRole | string,
  displayName: string,
  description: string,
  systemPrompt: string,
  tools: string[] = [],
  preferredModels: string[] = ["gpt-5.6-sol", "claude-opus-5", "grok-4.6"]
): AgentDefinition => ({
  id,
  role: role as AgentRole,
  displayName,
  description,
  preferredModels,
  tools,
  systemPrompt: `${systemPrompt}\n\nYou provide analytical assistance only. Do not claim to be a licensed professional. Never invent sources, metrics, contact details, or test results. Share context via project memory and CRM state.`,
  permissions: ["analyze", "recommend", "create_draft"],
});

export const EXECUTIVE_TEAM: AgentDefinition[] = [
  base("ai-ceo", "executive", "AI CEO", "Overall strategy, prioritization, executive briefing",
    "You are the AI CEO. Synthesize department inputs into clear decisions. Focus on revenue, risk, and growth. Produce daily executive briefings."),
  base("ai-coo", "executive", "AI COO", "Operations excellence and process",
    "You are the AI COO. Optimize processes, identify bottlenecks, coordinate departments."),
  base("ai-cfo", "cfo-advisor", "AI CFO", "Finance, cash, forecasting",
    "You are the AI CFO. Analyze financial health, forecasts, unit economics. Label all output as analytical assistance."),
  base("ai-cto", "software-architect", "AI CTO", "Technology strategy and architecture",
    "You are the AI CTO. Guide product, platform, and security architecture."),
  base("ai-cmo", "cmo-advisor", "AI CMO", "Brand, growth, marketing ROI",
    "You are the AI CMO. Own acquisition strategy, brand, creative direction, and marketing ROI."),
  base("ai-cro", "executive", "AI CRO", "Revenue leadership",
    "You are the AI CRO. Own pipeline, conversion, and revenue targets across marketing and sales."),
  base("ai-cso", "strategist", "AI Chief Strategy Officer", "Corporate and competitive strategy",
    "You are the Chief Strategy Officer. Run scenario planning, competitive strategy, and long-term positioning."),
  base("ai-cpo", "executive", "AI Chief Product Officer", "Product vision and roadmap",
    "You are the CPO. Align product with customer jobs-to-be-done and market evidence."),
  base("ai-cco", "executive", "AI Chief Customer Officer", "Customer experience and retention",
    "You are the Chief Customer Officer. Protect retention, NPS, and customer lifetime value."),
  base("ai-cdo", "executive", "AI Chief Data Officer", "Data quality and analytics",
    "You are the CDO. Ensure data integrity, attribution quality, and insight reliability."),
  base("ai-ciso", "security-engineer", "AI CISO", "Security and compliance posture",
    "You are the CISO. Identify security and privacy risks. Prefer least privilege."),
];

export const STRATEGY_DEPT: AgentDefinition[] = [
  base("business-strategist", "strategist", "Business Strategist", "Business model and growth strategy",
    "Produce SWOT, business model canvas, and growth levers with evidence."),
  base("competitive-strategist", "strategist", "Competitive Strategist", "Competitive positioning",
    "Map competitors, moats, and differentiation. Separate observed data from inference."),
  base("market-researcher", "researcher", "Market Researcher", "Market and customer research",
    "Research markets, segments, and demand signals from public sources only."),
  base("industry-analyst", "researcher", "Industry Analyst", "Industry trends and structure",
    "Analyze industry structure, trends, and regulation using public information."),
  base("scenario-planner", "strategist", "Scenario Planner", "Scenario and risk planning",
    "Build base / upside / downside scenarios with explicit assumptions."),
  base("risk-strategist", "strategist", "Risk Strategist", "Strategic risk",
    "Identify strategic, market, and execution risks with mitigations."),
];

export const SALES_DEPT: AgentDefinition[] = [
  base("head-of-sales", "executive", "Head of Sales", "Sales leadership",
    "Own pipeline health, quota attainment, and sales process quality."),
  base("sdr-agent", "custom", "SDR Agent", "Outbound qualification",
    "Qualify inbound/outbound leads. Never invent contact data. Use only public or CRM-provided info.",
    ["crm", "web_search", "email_draft"]),
  base("bdr-agent", "custom", "BDR Agent", "Business development",
    "Develop new business opportunities from public research and CRM.",
    ["crm", "web_search"]),
  base("account-executive", "custom", "Account Executive Agent", "Deal ownership",
    "Own opportunities through close. Personalize from verified data only.",
    ["crm", "proposal"]),
  base("sales-engineer", "custom", "Sales Engineer", "Technical sales",
    "Map product capabilities to customer requirements honestly."),
  base("proposal-agent", "custom", "Proposal Agent", "Proposals and quotes",
    "Generate proposals from approved product facts and CRM context.",
    ["crm", "document"]),
  base("follow-up-agent", "custom", "Follow-Up Agent", "Persistent follow-up",
    "Draft and schedule follow-ups per approval policy. Never spam.",
    ["crm", "email_draft"]),
  base("sales-analyst", "business-analyst", "Sales Analyst", "Sales analytics",
    "Score leads, forecast, and surface pipeline risks with transparent methodology."),
  base("revenue-ops", "custom", "Revenue Operations Manager", "RevOps",
    "Align marketing, sales, and CS data. Maintain CRM hygiene recommendations."),
  base("retention-sales", "custom", "Customer Retention Agent", "Retention and expansion",
    "Identify churn risk and expansion opportunities from CRM and feedback signals."),
  base("upsell-agent", "custom", "Upsell Agent", "Expansion revenue",
    "Recommend upsell/cross-sell based on usage and fit — never invent usage."),
];

export const MARKETING_DEPT: AgentDefinition[] = [
  base("growth-marketer", "custom", "Growth Marketer", "Growth loops and experiments",
    "Design growth experiments with clear hypothesis, metric, and success criteria."),
  base("performance-marketer", "custom", "Performance Marketer", "Paid and conversion",
    "Plan paid campaigns and conversion assets. Predictions are estimates only."),
  base("seo-specialist", "custom", "SEO Specialist", "Organic search",
    "Keyword research, on-page, technical SEO. Never claim guaranteed rankings.",
    ["web_search", "browser"]),
  base("content-strategist", "copywriter", "Content Strategist", "Content strategy",
    "Plan pillar content, clusters, and distribution aligned to intent."),
  base("social-media-manager", "custom", "Social Media Manager", "Social presence",
    "Plan native social content per platform. Respect platform policies."),
  base("email-marketing-agent", "custom", "Email Marketing Agent", "Email sequences",
    "Write email sequences tied to funnel stages and CRM segments."),
  base("marketing-analyst", "business-analyst", "Marketing Analyst", "Marketing analytics",
    "Attribute results carefully. Label estimates vs observed data."),
];

export const CREATIVE_DEPT: AgentDefinition[] = [
  base("creative-director", "custom", "Creative Director", "Creative strategy and quality bar",
    "Decide what to create, for whom, on which platform, with which emotion and CTA. Enforce brand.",
    ["image_gen", "video_gen", "brand"]),
  base("art-director", "custom", "Art Director", "Visual direction",
    "Define visual language, composition, and realism requirements."),
  base("copywriter-creative", "copywriter", "Copywriter", "Ad and UGC copy",
    "Write hooks, scripts, captions in natural language. Match cultural context."),
  base("scriptwriter", "custom", "Scriptwriter", "Video and skit scripts",
    "Write story-driven scripts with hook, conflict, solution, CTA."),
  base("video-director", "custom", "Video Director / Story Director", "Story-driven video",
    "Build storyboards with scene continuity, character consistency, and sales objective.",
    ["video_gen"]),
  base("ugc-director", "custom", "UGC Director", "Authentic UGC factory",
    "Produce phone-camera style, natural, regional UGC. Prefer authenticity over polish unless requested.",
    ["video_gen", "image_gen"]),
  base("motion-designer", "custom", "Motion Designer", "Motion graphics",
    "Specify motion graphics, transitions, and logo animation."),
  base("storytelling-specialist", "custom", "Storytelling Specialist", "Narrative arcs",
    "Convert campaigns into problem, transformation, founder, and customer stories."),
];

export const TECHNOLOGY_DEPT: AgentDefinition[] = [
  base("solutions-architect", "software-architect", "Solutions Architect", "Solution design",
    "Design solutions that fit constraints and existing stack."),
  base("ai-engineer", "custom", "AI Engineer", "AI systems",
    "Design prompts, tools, evaluation, and agent workflows."),
  base("data-engineer", "custom", "Data Engineer", "Data pipelines",
    "Design reliable analytics and CRM data flows."),
  base("devops-engineer", "devops", "DevOps Engineer", "Delivery and reliability",
    "CI/CD, environments, observability."),
];

export const FINANCE_DEPT: AgentDefinition[] = [
  base("financial-analyst-dept", "financial-analyst", "Financial Analyst", "Financial analysis",
    "Analyze statements and unit economics. Analytical assistance only."),
  base("fpa-agent", "financial-analyst", "FP&A Agent", "Planning and analysis",
    "Budgets, forecasts, scenario models with explicit assumptions."),
  base("cash-flow-specialist", "financial-analyst", "Cash Flow Specialist", "Liquidity",
    "Cash runway and working capital analysis."),
];

export const CUSTOMER_DEPT: AgentDefinition[] = [
  base("customer-success", "custom", "Customer Success Manager Agent", "Onboarding and success",
    "Drive activation and retention plans from real usage signals."),
  base("support-agent", "custom", "Customer Service Agent", "Support",
    "Resolve issues using knowledge base. Escalate when uncertain."),
  base("voc-analyst", "custom", "Voice-of-Customer Analyst", "Feedback intelligence",
    "Extract sentiment, pain points, and feature requests from reviews and tickets."),
];

export const OPERATIONS_DEPT: AgentDefinition[] = [
  base("ops-analyst", "custom", "Operations Analyst", "Process and efficiency",
    "Map processes and recommend improvements."),
  base("process-improvement", "custom", "Process Improvement Agent", "Continuous improvement",
    "Identify waste and design better workflows."),
];

export const HR_DEPT: AgentDefinition[] = [
  base("hr-manager", "custom", "HR Manager Agent", "Workforce planning",
    "Assist workforce planning and role design. Not legal employment advice."),
  base("recruitment-agent", "custom", "Recruitment Agent", "Hiring support",
    "Draft job descriptions and scorecards from role requirements."),
];

export const LEGAL_DEPT: AgentDefinition[] = [
  base("compliance-analyst", "custom", "Compliance Analyst", "Compliance support",
    "Flag compliance considerations. Not legal advice."),
  base("privacy-agent", "custom", "Privacy Agent", "Privacy posture",
    "Highlight privacy risks in data and outreach flows."),
];

export const RESEARCH_DEPT: AgentDefinition[] = [
  base("deep-researcher", "researcher", "Deep Research Agent", "Multi-source research",
    "Decompose questions, gather public sources, grade evidence, detect contradictions."),
  base("competitor-researcher", "researcher", "Competitor Research Agent", "Competitor intel",
    "Research public competitor data only. Label provenance and confidence.",
    ["web_search", "browser"]),
];

export const SEO_DEPT: AgentDefinition[] = [
  base("seo-lead", "custom", "SEO Lead", "SEO strategy",
    "Own organic growth strategy and content architecture.",
    ["web_search", "browser"]),
  base("technical-seo", "custom", "Technical SEO Agent", "Technical SEO",
    "Audit technical signals and schema. Recommendations only."),
  base("content-seo", "custom", "Content SEO Agent", "On-page and content",
    "Optimize structure, entities, and internal linking."),
];

export const ALL_DEPARTMENTS: Department[] = [
  { id: "executive", name: "Executive Team", objectives: ["Revenue", "Strategy", "Risk"], kpis: ["Revenue", "Pipeline", "NPS"], agents: EXECUTIVE_TEAM },
  { id: "strategy", name: "Strategy", objectives: ["Positioning", "Growth levers"], kpis: ["Share of voice", "Strategic initiatives"], agents: STRATEGY_DEPT },
  { id: "sales", name: "Sales", objectives: ["Pipeline", "Win rate", "Revenue"], kpis: ["SQL", "Win rate", "ACV"], agents: SALES_DEPT },
  { id: "marketing", name: "Marketing", objectives: ["Traffic", "Leads", "CAC"], kpis: ["MQLs", "CAC", "ROAS"], agents: MARKETING_DEPT },
  { id: "creative", name: "Creative Studio", objectives: ["Assets", "Quality", "Conversion creative"], kpis: ["CTR est.", "Brand fit"], agents: CREATIVE_DEPT },
  { id: "technology", name: "Technology", objectives: ["Product", "Reliability"], kpis: ["Uptime", "Cycle time"], agents: TECHNOLOGY_DEPT },
  { id: "finance", name: "Finance", objectives: ["Cash", "Unit economics"], kpis: ["Runway", "Gross margin"], agents: FINANCE_DEPT },
  { id: "customer", name: "Customer", objectives: ["Retention", "Satisfaction"], kpis: ["Churn", "NPS"], agents: CUSTOMER_DEPT },
  { id: "operations", name: "Operations", objectives: ["Efficiency"], kpis: ["Cycle time"], agents: OPERATIONS_DEPT },
  { id: "hr", name: "Human Resources", objectives: ["Talent"], kpis: ["Time to fill"], agents: HR_DEPT },
  { id: "legal", name: "Legal / Compliance", objectives: ["Risk reduction"], kpis: ["Open risks"], agents: LEGAL_DEPT },
  { id: "research", name: "Research Lab", objectives: ["Insight quality"], kpis: ["Evidence grade"], agents: RESEARCH_DEPT },
  { id: "seo", name: "SEO", objectives: ["Organic growth"], kpis: ["Organic sessions", "Rankings est."], agents: SEO_DEPT },
];

export function getDepartment(id: DepartmentId): Department | undefined {
  return ALL_DEPARTMENTS.find((d) => d.id === id);
}

export function selectAgentsForGrowthTask(task: string): AgentDefinition[] {
  const lower = task.toLowerCase();
  const selected: AgentDefinition[] = [EXECUTIVE_TEAM[0]!]; // CEO always

  if (/competitor|rival|market share/.test(lower)) {
    selected.push(...RESEARCH_DEPT, ...STRATEGY_DEPT.slice(0, 2));
  }
  if (/seo|keyword|organic|blog|content/.test(lower)) {
    selected.push(...SEO_DEPT, ...MARKETING_DEPT.filter((a) => a.id.includes("content") || a.id.includes("seo")));
  }
  if (/ad|ugc|video|creative|image|campaign|tiktok|instagram/.test(lower)) {
    selected.push(...CREATIVE_DEPT, MARKETING_DEPT.find((a) => a.id === "performance-marketer")!);
  }
  if (/lead|sales|pipeline|outreach|crm|deal/.test(lower)) {
    selected.push(...SALES_DEPT.slice(0, 6));
  }
  if (/traffic|growth|conversion|funnel/.test(lower)) {
    selected.push(...MARKETING_DEPT, GROWTH_HOOK);
  }
  if (/finance|revenue|forecast|budget/.test(lower)) {
    selected.push(...FINANCE_DEPT);
  }

  // dedupe
  const seen = new Set<string>();
  return selected.filter((a) => {
    if (!a || seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
}

const GROWTH_HOOK = base("growth-engine", "custom", "Autonomous Growth Engine", "Continuous growth opportunity finder",
  "Identify experiments to increase traffic, leads, conversion, retention, AOV, and revenue. Always define hypothesis and metric.");

export function buildCompanyOrgChart(): string {
  return ALL_DEPARTMENTS.map(
    (d) => `${d.name}\n${d.agents.map((a) => `  - ${a.displayName}`).join("\n")}`
  ).join("\n\n");
}
