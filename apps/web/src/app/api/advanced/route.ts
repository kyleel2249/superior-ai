import { NextRequest, NextResponse } from "next/server";
import {
  upsertTwin,
  getTwin,
  listTwins,
  simulateTwin,
  runScenario,
  runScenarioSet,
} from "@superior-ai/intelligence";
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
  if (view === "marketplace") {
    const category = req.nextUrl.searchParams.get("category") ?? undefined;
    const q = req.nextUrl.searchParams.get("q") ?? undefined;
    return NextResponse.json({
      listings: listMarketplace({ category, q }),
      stats: marketplaceStats(),
    });
  }
  return NextResponse.json({
    views: ["twins", "canaries", "verification", "marketplace"],
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

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
