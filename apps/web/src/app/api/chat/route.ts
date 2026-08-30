import { NextRequest, NextResponse } from "next/server";
import { modelRegistry, route, configureAndValidate, getAdapter } from "@superior-ai/ai-gateway";
import { selectCouncil, selectAgentsForGrowthTask, growthLoopPlan, buildCompanyOrgChart, parseUniversalCommand, listCommandsHelp, runOrchestrator } from "@superior-ai/agents";
import { createCampaignFromOneLiner } from "@superior-ai/creative";
import { clusterKeywords, planContentFactory } from "@superior-ai/seo";
import { createLeadShell, personalizeOutreach, funnelStages } from "@superior-ai/sales";
import { buildScorecard, emptyCompetitor, trafficIntelligenceShell } from "@superior-ai/competitor";
import type { IntelligenceLevel, TaskType } from "@superior-ai/core";
import {
  retrieveRelevantDurable,
  formatMemoryForPrompt,
  rememberDurable,
  getRejections,
} from "@superior-ai/memory";

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
    let message = String(body.message ?? "");
    let intelligenceLevel = (body.intelligenceLevel ?? "BALANCED") as IntelligenceLevel;
    if (!message.trim()) return NextResponse.json({ error: "Empty message" }, { status: 400 });

    // Universal slash commands (/research, /supreme, /autonomous, …)
    if (message.trim().toLowerCase() === "/help" || message.trim().toLowerCase() === "/commands") {
      return NextResponse.json({
        reply: listCommandsHelp(),
        meta: "Command Router",
        council: [],
      });
    }
    const parsed = parseUniversalCommand(message);
    if (parsed.command) {
      message = parsed.rest || message;
      if (parsed.intelligenceLevel) intelligenceLevel = parsed.intelligenceLevel;
      if (parsed.mode === "supreme") intelligenceLevel = "SUPREME";
      if (parsed.mode === "autonomous") intelligenceLevel = "AUTONOMOUS";
    }
    const commandMeta = parsed.command
      ? { command: parsed.command, mode: parsed.mode, departmentHint: parsed.departmentHint }
      : null;

    const envKeys = [
      { provider: "openai" as const, key: process.env.OPENAI_API_KEY, base: process.env.OPENAI_BASE_URL },
      { provider: "anthropic" as const, key: process.env.ANTHROPIC_API_KEY, base: process.env.ANTHROPIC_BASE_URL },
      { provider: "xai" as const, key: process.env.XAI_API_KEY, base: process.env.XAI_BASE_URL },
      { provider: "google" as const, key: process.env.GOOGLE_AI_API_KEY, base: process.env.GOOGLE_AI_BASE_URL },
      { provider: "openrouter" as const, key: process.env.OPENROUTER_API_KEY, base: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1" },
      { provider: "local" as const, key: process.env.LOCAL_INFERENCE_API_KEY, base: process.env.LOCAL_INFERENCE_URL },
    ];
    for (const e of envKeys) {
      if (e.key) await configureAndValidate(e.provider, { apiKey: e.key, baseUrl: e.base });
    }

    const profileId = body.profileId ?? "profile_default";
    const { records: memoryRecords, backend: memoryBackend } = await retrieveRelevantDurable({
      query: message,
      profileId,
      limit: 10,
    });
    const { records: rejectionRecords } = await retrieveRelevantDurable({
      query: message,
      profileId,
      types: ["rejection"],
      limit: 8,
    });
    const memoryBlock = formatMemoryForPrompt(memoryRecords);
    const rejections = [
      ...getRejections(profileId),
      ...rejectionRecords.map((r) => r.content),
    ].filter((v, i, a) => a.indexOf(v) === i);

    // Auto-store conversation turn (lightweight)
    await rememberDurable({
      type: "conversation",
      content: message.slice(0, 500),
      importance: 40,
      profileId,
      tags: ["chat"],
    });

    const taskType = parsed.command ? parsed.taskType : classifyTask(message);
    const lower = message.toLowerCase();
    const isSupreme = intelligenceLevel === "SUPREME" || intelligenceLevel === "MAXIMUM";
    const isAutonomous = intelligenceLevel === "AUTONOMOUS";
    const routing = route({
      taskType,
      difficulty: isSupreme || isAutonomous ? 5 : 3,
      risk: isSupreme ? "high" : "medium",
      requiredReasoning: true,
      requiredTools: isAutonomous ? ["web_search", "browser", "code_exec"] : [],
      requiredModality: ["text"],
      costSensitivity: intelligenceLevel === "FAST" ? "high" : "low",
      latencySensitivity: intelligenceLevel === "FAST" ? "high" : "low",
      privacyLevel: "standard",
      intelligenceLevel,
    });

    // Autonomous mode: run growth orchestrator when objective is clear
    if (isAutonomous && message.length > 12) {
      try {
        const orch = await runOrchestrator({
          objective: message,
          mode: "execute_safe",
          userId: body.profileId ?? "anonymous",
          projectId: body.projectId,
        });
        return NextResponse.json({
          reply: [
            `**AUTONOMOUS MODE** — objective accepted`,
            ``,
            orch.summary,
            ``,
            `**Agents:** ${orch.agents.join(", ")}`,
            `**Stages completed:** ${orch.stages.filter((s) => s.status === "completed").length}/${orch.stages.length}`,
            `**Memory stored:** ${orch.memoryStored}`,
            ``,
            ...orch.stages.slice(0, 12).map(
              (s) => `- **${s.stage}** (${s.owner}): ${s.status} — ${s.output.slice(0, 160)}`
            ),
          ].join("\n"),
          meta: `Autonomous Orchestrator · task=${orch.taskId ?? "ephemeral"}`,
          council: orch.agents,
          autonomous: true,
          stages: orch.stages,
          command: commandMeta,
        });
      } catch (orchErr) {
        console.error("[api/chat] autonomous", orchErr);
        // fall through to normal chat path
      }
    }

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
      const openrouterConfigured = Boolean(process.env.OPENROUTER_API_KEY);
      const statusLine = openrouterConfigured
        ? "No providers AVAILABLE despite OPENROUTER_API_KEY being set — the key may be invalid, or the health check failed. Check Admin → Providers for the specific error."
        : "No providers AVAILABLE. Set OPENROUTER_API_KEY in .env (or Admin → Providers) — see the Routing note above for why.";
      const plan = [
        structured || null,
        structured ? "" : null,
        `**Routing:** ${routing.reason}`,
        `**Council (${council.length}):** ${council.map((c) => c.displayName).join(", ")}`,
        ``,
        `**Status:** ${statusLine}`,
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
      memoryBlock || "",
      rejections.length
        ? `User has rejected these approaches — do not recommend unless circumstances clearly changed:\n${rejections.map((r) => `- ${r}`).join("\n")}`
        : "",
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

    const modeLabel = isSupreme ? "SUPREME" : isAutonomous ? "AUTONOMOUS" : intelligenceLevel;
    return NextResponse.json({
      reply: structured ? `${structured}\n\n---\n\n${completion.content}` : completion.content,
      meta: `${routing.primary.displayName} · ${modeLabel} · AI Council · memory:${memoryBackend}`,
      usage: completion.usage,
      council: council.map((c) => c.displayName),
      routing: {
        primary: routing.primary.displayName,
        secondary: routing.secondary?.displayName,
        critic: routing.critic?.displayName,
        reason: routing.reason,
      },
      memoryUsed: memoryRecords.length,
      memoryBackend,
      command: commandMeta,
      intelligenceLevel: modeLabel,
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
