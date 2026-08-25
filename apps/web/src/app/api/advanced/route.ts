import { autoGatherResearch } from "@superior-ai/research";
import { NextRequest, NextResponse } from "next/server";
import {
  upsertTwin,
  getTwin,
  listTwins,
  simulateTwin,
  runScenario,
  runScenarioSet,
  recordKpi,
  analyzeKpi,
  listKpiHistory,
  createRootCauseGraph,
  addEvidence,
  confirmCause,
  addFix,
  resolveGraph,
  listRootCauseGraphs,
  recordEconomics,
  economicsRollup,
  planCapacity,
  upsertEntity,
  linkEntities,
  searchEntities,
  neighbors,
  graphStats,
  generateOpportunities,
  evaluateSeriesAlert,
  pushAlert,
  listAlerts,
  listSlaPolicies,
  enqueueTask,
  dequeueNext,
  completeTask,
  listQueue,
  openIncident,
  advanceIncident,
  listIncidents,
  upsertUserProfile,
  getUserProfile,
  upsertProjectProfile,
  getProjectProfile,
  computeWorkforcePnL,
  generateProactiveInsights,
  staleEntities,
  refreshEntityFreshness,
  createExperiment,
  startExperiment,
  completeExperiment,
  listExperiments,
  upsertGoal,
  listGoals,
  alignTaskToGoals,
} from "@superior-ai/intelligence";
import { analyzeInstructions, mergeTrustedPrompt, scoreActionRisk, setAutonomyBoundary, isActionAllowed, planRemediation, approveRemediation, applyRemediation } from "@superior-ai/security";
import { listSkills, composeSkills, generateRoleFromBrief, saveCheckpoint, listCheckpoints, buildReplaySpec, planRedTeam, listAgentTemplates, cloneAgentTemplate } from "@superior-ai/agents";
import {
  runSandboxChecks,
  promoteFromSandbox,
  startCanary,
  advanceCanary,
  recordCanaryOutcome,
  listCanaries,
  getLifecycle,
  setLifecycle,
  startVerificationLoop,
  verifyCheckpoint,
  getVerificationLoop,
  listVerificationLoops,
  optimizePortfolio,
  simulateRoutingPolicies,
} from "@superior-ai/ai-gateway";
import {
  listMarketplace,
  installFromMarketplace,
  ratePack,
  marketplaceStats,
  disablePack,
  enablePack,
} from "@superior-ai/agents";

export async function GET(req: NextRequest) {
  const view = req.nextUrl.searchParams.get("view") ?? "overview";
  if (view === "twins") return NextResponse.json({ twins: listTwins() });
  if (view === "canaries") return NextResponse.json({ canaries: listCanaries() });
  if (view === "verification") return NextResponse.json({ loops: listVerificationLoops() });
  if (view === "kpi") return NextResponse.json({ history: listKpiHistory() });
  if (view === "root_cause") return NextResponse.json({ graphs: listRootCauseGraphs() });
  if (view === "economics") return NextResponse.json({ rollup: economicsRollup() });
  if (view === "knowledge") return NextResponse.json(graphStats());
  if (view === "alerts") return NextResponse.json({ alerts: listAlerts() });
  if (view === "queue") return NextResponse.json({ queue: listQueue(), sla: listSlaPolicies() });
  if (view === "incidents") return NextResponse.json({ incidents: listIncidents() });
  if (view === "skills") return NextResponse.json({ skills: listSkills() });
  if (view === "marketplace") {
    const category = req.nextUrl.searchParams.get("category") ?? undefined;
    const q = req.nextUrl.searchParams.get("q") ?? undefined;
    return NextResponse.json({
      listings: listMarketplace({ category, q }),
      stats: marketplaceStats(),
    });
  }
  return NextResponse.json({
    views: ["twins", "canaries", "verification", "marketplace", "kpi", "root_cause", "economics", "knowledge"],
    actions: [
      "twin_upsert",
      "twin_simulate",
      "scenario",
      "scenario_set",
      "sandbox",
      "promote",
      "canary_start",
      "canary_advance",
      "verify_start",
      "verify_checkpoint",
      "marketplace_install",
      "marketplace_rate",
    ],
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action ?? "");

    if (action === "twin_upsert") {
      return NextResponse.json(upsertTwin(body.twin ?? body), { status: 201 });
    }
    if (action === "twin_get") {
      const t = getTwin(String(body.id));
      if (!t) return NextResponse.json({ error: "not found" }, { status: 404 });
      return NextResponse.json(t);
    }
    if (action === "twin_simulate") {
      return NextResponse.json(
        simulateTwin(String(body.twinId), body.delta ?? {})
      );
    }
    if (action === "scenario") {
      return NextResponse.json(runScenario(body));
    }
    if (action === "scenario_set") {
      return NextResponse.json({
        scenarios: runScenarioSet(
          String(body.name ?? "Scenario"),
          String(body.metric ?? "revenue"),
          Number(body.baseline ?? 0)
        ),
      });
    }
    if (action === "sandbox") {
      return NextResponse.json(runSandboxChecks(String(body.modelId)));
    }
    if (action === "promote") {
      return NextResponse.json(promoteFromSandbox(String(body.modelId)));
    }
    if (action === "lifecycle") {
      setLifecycle(String(body.modelId), body.state);
      return NextResponse.json({ modelId: body.modelId, state: getLifecycle(String(body.modelId)) });
    }
    if (action === "canary_start") {
      return NextResponse.json(startCanary(String(body.modelId), body.percent ?? 5));
    }
    if (action === "canary_advance") {
      return NextResponse.json(advanceCanary(String(body.modelId)));
    }
    if (action === "canary_record") {
      return NextResponse.json(
        recordCanaryOutcome(String(body.modelId), body.ok !== false, body.quality)
      );
    }
    if (action === "verify_start") {
      return NextResponse.json(startVerificationLoop(String(body.taskId ?? `task_${Date.now()}`)));
    }
    if (action === "verify_checkpoint") {
      return NextResponse.json(
        verifyCheckpoint(String(body.loopId), body.stage, String(body.outputText ?? ""), {
          instruction: body.instruction,
          threshold: body.threshold,
          highRisk: body.highRisk === true,
        })
      );
    }
    if (action === "verify_get") {
      const loop = getVerificationLoop(String(body.loopId));
      if (!loop) return NextResponse.json({ error: "not found" }, { status: 404 });
      return NextResponse.json(loop);
    }
    if (action === "marketplace_install") {
      return NextResponse.json(
        installFromMarketplace(String(body.packId), String(body.organizationId ?? "local"))
      );
    }
    if (action === "marketplace_rate") {
      ratePack(String(body.packId), Number(body.stars ?? 5));
      return NextResponse.json({ ok: true });
    }
    if (action === "marketplace_disable") {
      disablePack(String(body.packId));
      return NextResponse.json({ ok: true });
    }
    if (action === "marketplace_enable") {
      enablePack(String(body.packId));
      return NextResponse.json({ ok: true });
    }


    if (action === "kpi_record") {
      recordKpi(body as any);
      return NextResponse.json({ ok: true, insight: analyzeKpi(String(body.kpi)) });
    }
    if (action === "kpi_analyze") {
      return NextResponse.json({ insight: analyzeKpi(String(body.kpi)), history: listKpiHistory(String(body.kpi)) });
    }
    if (action === "root_cause_create") {
      return NextResponse.json(createRootCauseGraph(body), { status: 201 });
    }
    if (action === "root_cause_evidence") {
      return NextResponse.json(addEvidence(String(body.graphId), String(body.causeId), String(body.evidence), body.confidence));
    }
    if (action === "root_cause_confirm") {
      return NextResponse.json(confirmCause(String(body.graphId), String(body.causeId)));
    }
    if (action === "root_cause_fix") {
      return NextResponse.json(addFix(String(body.graphId), String(body.fix)));
    }
    if (action === "root_cause_resolve") {
      return NextResponse.json(resolveGraph(String(body.graphId), String(body.verification)));
    }
    if (action === "economics_record") {
      return NextResponse.json(recordEconomics(body));
    }
    if (action === "economics_rollup") {
      return NextResponse.json(economicsRollup(body.department ? { department: body.department } : undefined));
    }
    if (action === "capacity_plan") {
      return NextResponse.json(planCapacity(body));
    }
    if (action === "trust_analyze") {
      const analysis = analyzeInstructions(body);
      return NextResponse.json({ analysis, merged: mergeTrustedPrompt(analysis) });
    }
    if (action === "kg_upsert") {
      return NextResponse.json(upsertEntity(body));
    }
    if (action === "kg_link") {
      return NextResponse.json(linkEntities(String(body.from), String(body.to), String(body.type), body.weight));
    }
    if (action === "kg_search") {
      return NextResponse.json({ entities: searchEntities(String(body.q ?? "")), neighbors: body.id ? neighbors(String(body.id)) : [] });
    }


    if (action === "opportunities") {
      return NextResponse.json({ opportunities: generateOpportunities(body) });
    }
    if (action === "alert_series") {
      const alert = evaluateSeriesAlert(body);
      if (alert) pushAlert(alert);
      return NextResponse.json({ alert });
    }
    if (action === "enqueue") {
      return NextResponse.json(enqueueTask(body));
    }
    if (action === "dequeue") {
      return NextResponse.json({ item: dequeueNext(body.tenantId) });
    }
    if (action === "complete_task") {
      return NextResponse.json(completeTask(String(body.id), body.ok !== false));
    }
    if (action === "incident_open") {
      return NextResponse.json(openIncident(body), { status: 201 });
    }
    if (action === "incident_advance") {
      return NextResponse.json(advanceIncident(String(body.id), body.status));
    }
    if (action === "action_risk") {
      return NextResponse.json(scoreActionRisk(body));
    }
    if (action === "autonomy_set") {
      setAutonomyBoundary(body);
      return NextResponse.json({ ok: true });
    }
    if (action === "autonomy_check") {
      return NextResponse.json(isActionAllowed(String(body.agentId), String(body.action)));
    }
    if (action === "skills_compose") {
      return NextResponse.json(composeSkills(body.skillIds ?? []));
    }
    if (action === "role_generate") {
      return NextResponse.json(generateRoleFromBrief(String(body.brief ?? "")));
    }


    if (action === "profile_user") {
      return NextResponse.json(upsertUserProfile(body));
    }
    if (action === "profile_user_get") {
      return NextResponse.json({ profile: getUserProfile(String(body.userId)) });
    }
    if (action === "profile_project") {
      return NextResponse.json(upsertProjectProfile(body));
    }
    if (action === "workforce_pnl") {
      return NextResponse.json(computeWorkforcePnL(body.periodLabel));
    }
    if (action === "proactive") {
      return NextResponse.json(generateProactiveInsights(body));
    }
    if (action === "portfolio") {
      return NextResponse.json(optimizePortfolio());
    }
    if (action === "routing_sim") {
      return NextResponse.json(
        simulateRoutingPolicies(String(body.text ?? ""), body.policyA ?? "FAST", body.policyB ?? "EXPERT")
      );
    }
    if (action === "checkpoint") {
      return NextResponse.json(saveCheckpoint(body));
    }
    if (action === "checkpoint_list") {
      return NextResponse.json({ checkpoints: listCheckpoints(String(body.taskId)) });
    }
    if (action === "replay") {
      return NextResponse.json(buildReplaySpec(String(body.taskId), body.checkpointId));
    }
    if (action === "red_team") {
      return NextResponse.json(planRedTeam(String(body.subject ?? "")));
    }
    if (action === "stale_knowledge") {
      return NextResponse.json({ stale: staleEntities(body.threshold) });
    }
    if (action === "refresh_freshness") {
      return NextResponse.json({ entity: refreshEntityFreshness(String(body.id)) });
    }
    if (action === "remediate_plan") {
      return NextResponse.json(planRemediation(String(body.problem ?? "")));
    }
    if (action === "remediate_apply") {
      if (body.approve) approveRemediation(String(body.id));
      return NextResponse.json(applyRemediation(String(body.id), body.approved === true || body.approve === true));
    }


    if (action === "experiment_create") {
      return NextResponse.json(createExperiment(body), { status: 201 });
    }
    if (action === "experiment_start") {
      return NextResponse.json(startExperiment(String(body.id)));
    }
    if (action === "experiment_complete") {
      return NextResponse.json(completeExperiment(String(body.id), body.results ?? {}));
    }
    if (action === "experiments_list") {
      return NextResponse.json({ experiments: listExperiments() });
    }
    if (action === "goal_upsert") {
      return NextResponse.json(upsertGoal(body));
    }
    if (action === "goals_list") {
      return NextResponse.json({ goals: listGoals() });
    }
    if (action === "goal_align") {
      return NextResponse.json({ alignment: alignTaskToGoals(String(body.taskSummary ?? "")) });
    }
    if (action === "templates_list") {
      return NextResponse.json({ templates: listAgentTemplates() });
    }
    if (action === "template_clone") {
      return NextResponse.json({ template: cloneAgentTemplate(String(body.id), body.suffix) });
    }


    if (action === "research_gather") {
      const brief = await autoGatherResearch(String(body.query ?? body.q ?? ""), {
        allEngines: body.allEngines !== false,
      });
      return NextResponse.json(brief);
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
