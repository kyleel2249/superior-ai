import { NextRequest, NextResponse } from "next/server";
import { modelRegistry, route, configureAndValidate, getAdapter } from "@superior-ai/ai-gateway";
import { selectCouncil, selectAgentsForGrowthTask, growthLoopPlan, buildCompanyOrgChart } from "@superior-ai/agents";
import { createCampaignFromOneLiner } from "@superior-ai/creative";
import { clusterKeywords, planContentFactory } from "@superior-ai/seo";
import { createLeadShell, personalizeOutreach, funnelStages } from "@superior-ai/sales";
import { buildScorecard, emptyCompetitor, trafficIntelligenceShell } from "@superior-ai/competitor";
import type { IntelligenceLevel, TaskType } from "@superior-ai/core";

function classifyTask(message: string): TaskType {
  const lower = message.toLowerCase();
  if (/\b(ugc|ad|video|image|creative|skit|campaign|tiktok|reel)\b/.test(lower)) return "creative";
  if (/\b(code|build|implement|debug|deploy)\b/.test(lower)) return "coding";
  if (/\b(seo|keyword|organic|serp)\b/.test(lower)) return "research";
  if (/\b(competitor|rival)\b/.test(lower)) return "research";
  if (/\b(lead|sales|pipeline|outreach|crm)\b/.test(lower)) return "analysis";
  if (/\b(research|search|find)\b/.test(lower)) return "research";
  if (/\b(finance|revenue|forecast)\b/.test(lower)) return "financial";
  if (/\b(strategy|swot)\b/.test(lower)) return "strategy";
  return "chat";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = String(body.message ?? "");
    const intelligenceLevel = (body.intelligenceLevel ?? "BALANCED") as IntelligenceLevel;
    if (!message.trim()) return NextResponse.json({ error: "Empty message" }, { status: 400 });

    const envKeys = [
      { provider: "openai" as const, key: process.env.OPENAI_API_KEY, base: process.env.OPENAI_BASE_URL },
      { provider: "anthropic" as const, key: process.env.ANTHROPIC_API_KEY, base: process.env.ANTHROPIC_BASE_URL },
      { provider: "xai" as const, key: process.env.XAI_API_KEY, base: process.env.XAI_BASE_URL },
      { provider: "google" as const, key: process.env.GOOGLE_AI_API_KEY, base: process.env.GOOGLE_AI_BASE_URL },
      { provider: "local" as const, key: process.env.LOCAL_INFERENCE_API_KEY, base: process.env.LOCAL_INFERENCE_URL },
    ];
    for (const e of envKeys) {
      if (e.key) await configureAndValidate(e.provider, { apiKey: e.key, baseUrl: e.base });
    }

    const taskType = classifyTask(message);
    const lower = message.toLowerCase();
    const routing = route({
      taskType,
      difficulty: 3,
      risk: "medium",
      requiredReasoning: true,
      requiredTools: [],
      requiredModality: ["text"],
      costSensitivity: intelligenceLevel === "FAST" ? "high" : "medium",
      latencySensitivity: intelligenceLevel === "FAST" ? "high" : "medium",
      privacyLevel: "standard",
      intelligenceLevel,
    });

    const council = selectAgentsForGrowthTask(message);
    const available = modelRegistry.list({ availableOnly: true });

    // Structured department responses for common intents
    let structured = "";

    if (/run as a company|org chart|departments|ai company/.test(lower)) {
      structured = `**AI COMPANY MODE — Organization**\n\n${buildCompanyOrgChart()}`;
    } else if (/growth loop|autonomous growth|master loop/.test(lower)) {
      const plan = growthLoopPlan(message);
      structured = `**Master Autonomous Growth Loop**\n\n${plan.map((p, i) => `${i + 1}. **${p.stage}** — ${p.owner}\n   → ${p.output}`).join("\n")}`;
    } else if (/campaign|ugc ad|create.*(ad|video|ugc)/.test(lower)) {
      const camp = createCampaignFromOneLiner({
        oneLiner: message,
        product: "your product",
        audience: "target customers",
        region: lower.includes("ghana") ? "Ghana" : undefined,
        platforms: ["tiktok", "instagram", "facebook", "linkedin"],
      });
      structured = [
        `**Campaign Engine**`,
        `Objective: ${camp.campaign.objective}`,
        `ICP: ${camp.campaign.icp}`,
        `Platforms: ${camp.campaign.platforms.join(", ")}`,
        ``,
        `**Story Board**`,
        `Hook: ${camp.storyBoard.hook}`,
        `Conflict: ${camp.storyBoard.conflict}`,
        `Solution: ${camp.storyBoard.solution}`,
        `CTA: ${camp.storyBoard.cta}`,
        ``,
        `**Performance prediction (estimates only)**`,
        `Hook ${camp.predictions.hookStrength} · Attention ${camp.predictions.attentionPotential} · CTA ${camp.predictions.ctaStrength}`,
        `Predicted CTR ~${camp.predictions.predictedCtr}% · Confidence ${camp.predictions.creativeConfidence}`,
        camp.predictions.disclaimer,
        ``,
        `**10 script angles**`,
        ...camp.scripts.map((s) => `- ${s.angle}`),
        ``,
        `**Checklist**`,
        ...camp.checklist.map((c) => `- ${c}`),
      ].join("\n");
    } else if (/\bseo\b|keyword/.test(lower)) {
      const seed = message.replace(/seo|keyword|research/gi, "").trim() || "crm software";
      const cluster = clusterKeywords(seed);
      const content = planContentFactory(cluster.pillar);
      structured = [
        `**SEO Intelligence**`,
        `Pillar: ${cluster.pillar}`,
        `Keywords: ${cluster.keywords.map((k) => k.term).join(", ")}`,
        `Content gaps: ${cluster.contentGaps.join("; ")}`,
        ``,
        `**Content factory plan**`,
        ...content.map((c) => `- ${c}`),
        ``,
        `Rankings are never guaranteed.`,
      ].join("\n");
    } else if (/competitor/.test(lower)) {
      const scorecard = buildScorecard([
        emptyCompetitor("Competitor A", "https://example-a.com"),
        emptyCompetitor("Competitor B", "https://example-b.com"),
      ]);
      const traffic = trafficIntelligenceShell("example-a.com");
      structured = [
        `**Competitor Intelligence**`,
        `Profiles initialized (live crawl required for real data).`,
        `Opportunities: ${scorecard.opportunityMap.join("; ")}`,
        `Threats: ${scorecard.threatMap.join("; ")}`,
        ``,
        `**Traffic shell for example-a.com**`,
        `Provenance: ${traffic.provenance} · Confidence: ${traffic.confidence}%`,
        traffic.note,
      ].join("\n");
    } else if (/lead|sales funnel|outreach/.test(lower)) {
      const lead = createLeadShell("Example Co", "https://example.com");
      const outreach = personalizeOutreach(lead, "SUPERIOR AI / your product");
      structured = [
        `**Sales Engine**`,
        `Funnel: ${funnelStages().join(" → ")}`,
        ``,
        `**Sample lead shell** (no invented contacts)`,
        `Company: ${lead.company} · Provenance: ${lead.provenance}`,
        ``,
        `**Personalized draft**`,
        `Subject: ${outreach.emailSubject}`,
        outreach.emailBody,
        ``,
        outreach.disclaimer,
      ].join("\n");
    }

    if (available.length === 0) {
      const plan = [
        structured || null,
        structured ? "" : null,
        `**Routing:** ${routing.reason}`,
        `**Council (${council.length}):** ${council.map((c) => c.displayName).join(", ")}`,
        ``,
        `**Status:** No providers AVAILABLE. Configure keys in Admin → Providers or .env.`,
        `Objective received. When a provider validates, the same request executes via the selected models and departments.`,
      ]
        .filter(Boolean)
        .join("\n");

      return NextResponse.json({
        reply: plan,
        meta: "Executive Agent · Department Orchestration",
        council: council.map((c) => c.displayName),
        routing: { primary: routing.primary.displayName, status: routing.primary.status },
      });
    }

    const adapter = getAdapter(routing.primary.provider);
    const system = [
      `You are SUPERIOR AI — AI Business Operating System + Creative Studio + Marketing Agency + Sales Org + Research Lab.`,
      `Departments share memory, CRM, campaigns, and analytics.`,
      `Council: ${council.map((c) => c.displayName).join(", ")}.`,
      `Never invent contacts, traffic numbers, rankings, or test results. Label estimates.`,
      structured ? `Structured department output already prepared — refine and extend it:\n${structured}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const completion = await adapter.chat({
      model: routing.primary.modelId,
      messages: [
        { role: "system", content: system },
        { role: "user", content: message },
      ],
      temperature: 0.6,
      max_tokens: 4096,
    });

    return NextResponse.json({
      reply: structured ? `${structured}\n\n---\n\n${completion.content}` : completion.content,
      meta: `${routing.primary.displayName} · AI Council`,
      usage: completion.usage,
      council: council.map((c) => c.displayName),
      routing: { primary: routing.primary.displayName, reason: routing.reason },
    });
  } catch (err) {
    console.error("[api/chat]", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : String(err),
        reply: `Error: ${err instanceof Error ? err.message : String(err)}`,
        meta: "System",
      },
      { status: 500 }
    );
  }
}
