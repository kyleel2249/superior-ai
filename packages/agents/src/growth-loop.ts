/**
 * MASTER AUTONOMOUS GROWTH LOOP
 * RESEARCH → STRATEGY → CREATIVE → MARKETING → TRAFFIC → LEADS → SALES → …
 */

export const GROWTH_LOOP_STAGES = [
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

export type GrowthStage = (typeof GROWTH_LOOP_STAGES)[number];

export function growthLoopPlan(objective: string): Array<{ stage: GrowthStage; owner: string; output: string }> {
  const stages: Array<{ stage: GrowthStage; owner: string; output: string }> = [
    { stage: "RESEARCH", owner: "Deep Research + Market Researcher", output: "Evidence pack" },
    { stage: "UNDERSTAND_CUSTOMER", owner: "VoC + Strategist", output: "Jobs, pains, language" },
    { stage: "ANALYZE_COMPETITORS", owner: "Competitor Research", output: "Scorecard + gaps" },
    { stage: "IDENTIFY_OPPORTUNITY", owner: "Growth Engine + CMO", output: "Opportunity map" },
    { stage: "CREATE_STRATEGY", owner: "CSO + CMO + CRO", output: "Campaign strategy" },
    { stage: "CREATE_CONTENT", owner: "Content Strategist + SEO", output: "Pillar + clusters" },
    { stage: "CREATE_IMAGES", owner: "Art Director + Creative", output: "Image variants" },
    { stage: "CREATE_VIDEOS", owner: "Story Director", output: "Storyboards + scripts" },
    { stage: "CREATE_UGC", owner: "UGC Director", output: "UGC set" },
    { stage: "CREATE_SEO_ASSETS", owner: "SEO Lead", output: "On-page + metadata" },
    { stage: "CREATE_LANDING_PAGE", owner: "Growth + Frontend", output: "LP spec" },
    { stage: "CREATE_CAMPAIGN", owner: "Performance Marketer", output: "Campaign package" },
    { stage: "PUBLISH_WITH_AUTHORIZATION", owner: "Executive + Approval", output: "Published assets" },
    { stage: "GENERATE_LEADS", owner: "Lead Gen + SDR", output: "Lead list" },
    { stage: "QUALIFY_LEADS", owner: "SDR", output: "SQLs" },
    { stage: "SALES_FOLLOW_UP", owner: "Follow-Up + AE", output: "Conversations" },
    { stage: "CONVERT", owner: "AE + Proposal", output: "Closed deals" },
    { stage: "ONBOARD", owner: "Customer Success", output: "Activation" },
    { stage: "RETAIN", owner: "Retention + CS", output: "Renewals" },
    { stage: "COLLECT_FEEDBACK", owner: "VoC", output: "Insights" },
    { stage: "ANALYZE_PERFORMANCE", owner: "Marketing + Sales Analyst", output: "Scorecard" },
    { stage: "OPTIMIZE", owner: "Growth Engine", output: "Next experiments" },
  ];
  return stages.map((s) => ({ ...s, output: `${s.output} for: ${objective.slice(0, 80)}` }));
}
