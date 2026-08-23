import { recordUsage, recordModelCost } from "@superior-ai/billing";
import { audit } from "@superior-ai/audit";
/**
 * Department Orchestrator
 * Runs multi-agent plans with stage tracking — foundation for durable tasks.
 */

import { selectAgentsForGrowthTask } from "../departments/full-council";
import { growthLoopPlan } from "../growth-loop";
import { createCampaignFromOneLiner } from "@superior-ai/creative";
import { clusterKeywords, planContentFactory } from "@superior-ai/seo";
import { createLeadShell, personalizeOutreach, funnelStages, scoreLead } from "@superior-ai/sales";
import { buildScorecard, emptyCompetitor, trafficIntelligenceShell, comparisonTemplate } from "@superior-ai/competitor";
import { generateWeekCalendar, contentIdeas, proposeExperiments, growthOpportunities } from "@superior-ai/marketing";
import { globalMemory } from "@superior-ai/memory";
import { runTool } from "@superior-ai/tools";
import { saveTask, updateTaskStage } from "@superior-ai/db";

export interface OrchestratorInput {
  objective: string;
  mode?: "plan_only" | "execute_safe" | "full";
  region?: string;
  product?: string;
  audience?: string;
  competitorUrls?: string[];
  userId?: string;
  projectId?: string;
}

export interface StageResult {
  stage: string;
  owner: string;
  status: "completed" | "skipped" | "needs_approval" | "needs_live_data";
  output: string;
  data?: unknown;
}

export interface OrchestratorResult {
  taskId?: string;
  objective: string;
  agents: string[];
  stages: StageResult[];
  memoryStored: number;
  summary: string;
}

export async function runOrchestrator(input: OrchestratorInput): Promise<OrchestratorResult> {
  const product = input.product ?? "the product";
  const audience = input.audience ?? "target customers";
  const agents = selectAgentsForGrowthTask(input.objective);
  const plan = growthLoopPlan(input.objective);
  const stages: StageResult[] = [];
  let memoryStored = 0;

  const durable = await saveTask({
    userId: input.userId ?? "anonymous",
    projectId: input.projectId,
    title: input.objective.slice(0, 120),
    objective: input.objective,
    stage: "planning",
    pendingSteps: plan.map((p) => p.stage),
    state: { product, audience, region: input.region },
  });
  const taskId = durable.id;

  globalMemory.add({
    layer: "project",
    content: `Objective: ${input.objective}`,
    importance: 90,
    trust: 100,
    source: "user",
  });
  memoryStored++;

  // RESEARCH stage — live search when available (approval not required for public search)
  if (input.mode !== "plan_only") {
    const search = await runTool(
      "web_search",
      { query: input.objective.slice(0, 200) },
      {
        approvalPolicy: "sensitive_only",
        grantedPermissions: ["web_search", "browser"],
        projectId: input.projectId,
        userId: input.userId,
      }
    );
    if (search.success && search.data) {
      const sd = search.data as {
        results?: Array<{ title?: string; url?: string; snippet?: string }>;
        engine?: string;
        status?: string;
        note?: string;
        query?: string;
      };
      const hits = sd.results ?? [];
      if (hits.length) {
        for (const h of hits.slice(0, 5)) {
          globalMemory.add({
            layer: "knowledge",
            content: `Search: ${h.title} — ${h.snippet ?? ""} (${h.url})`,
            importance: 60,
            trust: 75,
            source: h.url,
          });
          memoryStored++;
        }
        stages.push({
          stage: "RESEARCH",
          owner: "Market Researcher + Search Agent",
          status: "completed",
          output: `Live search via ${sd.engine ?? "adapter"}: ${hits.length} results for "${sd.query ?? input.objective.slice(0, 80)}"`,
          data: { engine: sd.engine, results: hits.slice(0, 8) },
        });
      } else {
        stages.push({
          stage: "RESEARCH",
          owner: "Market Researcher + Search Agent",
          status: "needs_live_data",
          output: sd.note ?? "No live search results. Configure SERPER/BING/TAVILY or retry.",
          data: sd,
        });
      }
    } else {
      stages.push({
        stage: "RESEARCH",
        owner: "Market Researcher + Search Agent",
        status: "needs_live_data",
        output: search.error ?? "Search tool unavailable",
      });
    }
  }

  if (input.competitorUrls?.length) {
    for (const url of input.competitorUrls.slice(0, 5)) {
      const fetched = await runTool(
        "url_fetch",
        { url },
        {
          approvalPolicy: "sensitive_only",
          grantedPermissions: ["browser", "web_search"],
          projectId: input.projectId,
          userId: input.userId,
        }
      );
      if (fetched.success && fetched.data) {
        const d = fetched.data as { title?: string; textExcerpt?: string; url?: string };
        globalMemory.add({
          layer: "knowledge",
          content: `Competitor page ${d.url}: ${d.title ?? ""} — ${(d.textExcerpt ?? "").slice(0, 800)}`,
          importance: 70,
          trust: 80,
          source: d.url,
        });
        memoryStored++;
        stages.push({
          stage: "ANALYZE_COMPETITORS",
          owner: "Competitor Research Agent",
          status: "completed",
          output: `Fetched public page: ${d.title ?? url}`,
          data: { url: d.url, title: d.title },
        });
      } else {
        stages.push({
          stage: "ANALYZE_COMPETITORS",
          owner: "Competitor Research Agent",
          status: "needs_live_data",
          output: fetched.error ?? "Fetch failed",
        });
      }
    }
  } else {
    const scorecard = buildScorecard([
      emptyCompetitor("Competitor A", "https://example-a.com"),
      emptyCompetitor("Competitor B", "https://example-b.com"),
    ]);
    stages.push({
      stage: "ANALYZE_COMPETITORS",
      owner: "Competitor Research Agent",
      status: "needs_live_data",
      output: `Scorecard template ready. Provide competitor URLs for live crawl. Opportunities: ${scorecard.opportunityMap[0]}`,
      data: scorecard,
    });
  }

  const campaign = createCampaignFromOneLiner({
    oneLiner: input.objective,
    product,
    audience,
    region: input.region,
  });
  stages.push({
    stage: "CREATE_CAMPAIGN",
    owner: "Creative Director + Performance Marketer",
    status: "completed",
    output: `Campaign draft for ${audience}. ${campaign.scripts.length} script angles. Checklist: ${campaign.checklist.length} items.`,
    data: {
      campaign: campaign.campaign,
      predictions: campaign.predictions,
      storyBoard: campaign.storyBoard,
      scripts: campaign.scripts.slice(0, 5),
    },
  });
  globalMemory.add({
    layer: "project",
    content: `Campaign objective: ${campaign.campaign.objective}; CTA: ${campaign.storyBoard.cta}`,
    importance: 85,
    trust: 90,
    source: "campaign_engine",
  });
  memoryStored++;

  const cluster = clusterKeywords(product);
  const contentPlan = planContentFactory(cluster.pillar);
  stages.push({
    stage: "CREATE_SEO_ASSETS",
    owner: "SEO Lead",
    status: "completed",
    output: `Pillar "${cluster.pillar}" with ${cluster.keywords.length} keywords and ${contentPlan.length} content pieces planned.`,
    data: { cluster, contentPlan },
  });

  const calendar = generateWeekCalendar(product);
  const experiments = proposeExperiments(input.objective);
  stages.push({
    stage: "CREATE_CONTENT",
    owner: "Content Strategist + Social Media Manager",
    status: "completed",
    output: `7-day calendar (${calendar.length} items). Ideas ready. ${experiments.length} experiments proposed.`,
    data: { calendar, experiments, ideas: contentIdeas(product, 5), opportunities: growthOpportunities() },
  });

  const lead = createLeadShell("Prospect Co", undefined, "orchestrator");
  const scores = scoreLead({ industryFit: 70, sizeFit: 65, publicSignals: 40, engagement: 20 });
  const outreach = personalizeOutreach({ ...lead, fitScore: scores.fitScore, opportunityScore: scores.opportunityScore, intentScore: scores.intentScore, engagementScore: scores.engagementScore }, product);
  stages.push({
    stage: "SALES_FOLLOW_UP",
    owner: "SDR + Follow-Up Agent",
    status: "needs_approval",
    output: `Outreach draft ready (not sent). Funnel: ${funnelStages().slice(0, 6).join(" → ")}…`,
    data: { lead, scores, outreach },
  });

  // RESEARCH may already be filled by live search above
  if (!stages.some((s) => s.stage === "RESEARCH")) {
    stages.push({
      stage: "RESEARCH",
      owner: "Market Researcher",
      status: "needs_live_data",
      output: trafficIntelligenceShell("example.com").note,
      data: trafficIntelligenceShell("example.com"),
    });
  }

  stages.push({
    stage: "IDENTIFY_OPPORTUNITY",
    owner: "Competitive Strategist",
    status: "completed",
    output: comparisonTemplate(product, "primary competitor"),
  });

  for (const p of plan) {
    if (stages.some((s) => s.stage === p.stage)) continue;
    stages.push({
      stage: p.stage,
      owner: p.owner,
      status: input.mode === "plan_only" ? "skipped" : "needs_live_data",
      output: p.output,
    });
  }

  const summary = [
    `Objective: ${input.objective}`,
    `Agents engaged: ${agents.map((a) => a.displayName).join(", ")}`,
    `Stages recorded: ${stages.length}`,
    `Memory items stored: ${memoryStored}`,
    `Campaign predictions: CTR~${campaign.predictions.predictedCtr}% (estimate only)`,
    `Next: supply competitor URLs and API keys for live research; approve outreach to send.`,
  ].join("\n");

  await updateTaskStage(taskId, {
    stage: "reviewing",
    state: { stageCount: stages.length, memoryStored },
  });

  audit({
    action: "orchestrate.run",
    actorId: input.userId,
    organizationId: input.projectId,
    resourceType: "orchestration",
    resourceId: taskId,
    outcome: "success",
    meta: { objective: input.objective, stages: stages.length },
  });
  try {
    recordUsage({
      organizationId: input.projectId,
      userId: input.userId,
      meter: "api_requests",
      quantity: 1,
      costUsd: 0,
    });
  } catch { /* optional */ }

  return {
    taskId,
    objective: input.objective,
    agents: agents.map((a) => a.displayName),
    stages,
    memoryStored,
    summary,
  };
}

export async function runSafeUrlAudit(url: string) {
  return runTool(
    "url_audit",
    { url },
    {
      approvalPolicy: "sensitive_only",
      grantedPermissions: ["browser"],
    }
  );
}
