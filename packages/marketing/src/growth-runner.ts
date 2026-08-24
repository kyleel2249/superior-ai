/**
 * Execute growth loop as staged plan with department owners (no fake metrics).
 */

import { proposeExperiments, growthOpportunities } from "./growth";
import { generateWeekCalendar, contentIdeas } from "./calendar";
import { createLaunchWorkflow, createNurtureWorkflow } from "./automation";

export const GROWTH_STAGES = [
  "RESEARCH",
  "UNDERSTAND_CUSTOMER",
  "ANALYZE_COMPETITORS",
  "IDENTIFY_OPPORTUNITY",
  "CREATE_STRATEGY",
  "CREATE_CONTENT",
  "CREATE_IMAGES",
  "CREATE_VIDEOS",
  "CREATE_UGC",
  "CREATE_SEO_ASSETS",
  "CREATE_LANDING_PAGE",
  "CREATE_CAMPAIGN",
  "PUBLISH_WITH_AUTHORIZATION",
  "GENERATE_LEADS",
  "QUALIFY_LEADS",
  "SALES_FOLLOW_UP",
  "CONVERT",
  "ONBOARD",
  "RETAIN",
  "COLLECT_FEEDBACK",
  "ANALYZE_PERFORMANCE",
  "OPTIMIZE",
] as const;

export type GrowthStageId = (typeof GROWTH_STAGES)[number];

const OWNERS: Record<string, string> = {
  RESEARCH: "Deep Research + Market Researcher",
  UNDERSTAND_CUSTOMER: "VoC + Strategist",
  ANALYZE_COMPETITORS: "Competitor Research",
  IDENTIFY_OPPORTUNITY: "Growth Engine + CMO",
  CREATE_STRATEGY: "CSO + CMO + CRO",
  CREATE_CONTENT: "Content Strategist + SEO",
  CREATE_IMAGES: "Art Director + Creative",
  CREATE_VIDEOS: "Story Director",
  CREATE_UGC: "UGC Director",
  CREATE_SEO_ASSETS: "SEO Lead",
  CREATE_LANDING_PAGE: "Growth + Frontend",
  CREATE_CAMPAIGN: "Performance Marketer",
  PUBLISH_WITH_AUTHORIZATION: "Executive + Approval",
  GENERATE_LEADS: "Lead Gen + SDR",
  QUALIFY_LEADS: "SDR",
  SALES_FOLLOW_UP: "Follow-Up + AE",
  CONVERT: "AE + Proposal",
  ONBOARD: "Customer Success",
  RETAIN: "Retention + CS",
  COLLECT_FEEDBACK: "VoC",
  ANALYZE_PERFORMANCE: "Marketing + Sales Analyst",
  OPTIMIZE: "Growth Engine",
};

export interface GrowthRun {
  id: string;
  objective: string;
  product: string;
  audience: string;
  stages: Array<{
    stage: GrowthStageId;
    owner: string;
    output: string;
    status: "planned" | "ready" | "blocked_approval" | "done";
  }>;
  experiments: ReturnType<typeof proposeExperiments>;
  opportunities: string[];
  calendar: ReturnType<typeof generateWeekCalendar>;
  contentIdeas: string[];
  workflows: Array<{ id: string; name: string }>;
  note: string;
}

export function runGrowthLoop(input: {
  objective: string;
  product: string;
  audience?: string;
}): GrowthRun {
  const audience = input.audience ?? "target customers";
  const obj = input.objective.slice(0, 80);
  const launch = createLaunchWorkflow(input.product);
  const nurture = createNurtureWorkflow(input.product, audience);

  return {
    id: `gr_${Date.now().toString(36)}`,
    objective: input.objective,
    product: input.product,
    audience,
    stages: GROWTH_STAGES.map((stage) => ({
      stage,
      owner: OWNERS[stage] ?? "Growth",
      output: `${stage} deliverable for: ${obj}`,
      status: stage === "PUBLISH_WITH_AUTHORIZATION" ? ("blocked_approval" as const) : ("planned" as const),
    })),
    experiments: proposeExperiments(input.objective),
    opportunities: growthOpportunities(),
    calendar: generateWeekCalendar(input.product),
    contentIdeas: contentIdeas(input.product),
    workflows: [
      { id: launch.id, name: launch.name },
      { id: nurture.id, name: nurture.name },
    ],
    note: "Growth loop is orchestration + drafts. Publish/ads/email send require approval and live connectors. Metrics not fabricated.",
  };
}
