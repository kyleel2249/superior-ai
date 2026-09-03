import { NextRequest, NextResponse } from "next/server";
import {
  modelRegistry,
  listCredentialStatus,
  discoverModels,
  discoverAllConfigured,
  benchmarkModel,
  checkAllFromEnv,
  getHealthSnapshot,
  runBenchmarkSuite,
  getBenchmarkHistory,
  getLatestBenchmark,
  compareModels,
  GOLDEN_TASKS,
  getLifecycle,
  runSandboxChecks,
  promoteFromSandbox,
  setProviderKey,
  deleteProviderKey,
} from "@superior-ai/ai-gateway";
import type { BenchmarkCategory } from "@superior-ai/ai-gateway";
import type { ProviderId } from "@superior-ai/core";

export async function GET(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get("provider") as ProviderId | null;
  const resolve = req.nextUrl.searchParams.get("resolve");
  const availableOnly = req.nextUrl.searchParams.get("available") === "1";

  if (resolve) {
    const result = modelRegistry.resolve(resolve);
    return NextResponse.json({
      query: resolve,
      ...result,
      note:
        result.status === "FUTURE_UNAVAILABLE" || result.status === "UNAVAILABLE"
          ? "Model is not available — route to best verified fallback; never fake responses as this model."
          : undefined,
    });
  }

  let models = modelRegistry.list(provider ? { provider } : undefined);
  if (availableOnly) {
    models = models.filter((m) => m.availability && m.status === "AVAILABLE");
  }

  if (req.nextUrl.searchParams.get("goldenTasks") === "1") {
    return NextResponse.json({
      tasks: GOLDEN_TASKS.map((t) => ({ id: t.id, category: t.category, checkDescription: t.checkDescription })),
    });
  }

  return NextResponse.json({
    models: models.map((m) => ({
      id: m.id,
      provider: m.provider,
      modelId: m.modelId,
      displayName: m.displayName,
      status: m.status,
      availability: m.availability,
      healthScore: m.healthScore,
      priority: m.priority,
      fallbackPriority: m.fallbackPriority,
      contextWindow: m.contextWindow,
      maxOutput: m.maxOutput,
      multimodalSupport: m.multimodalSupport,
      functionCalling: m.functionCalling,
      structuredOutput: m.structuredOutput,
      aliases: m.aliases,
      scores: m.scores,
      lifecycle: getLifecycle(m.id),
      latestBenchmark: getLatestBenchmark(m.id) ?? null,
    })),
    credentials: listCredentialStatus(),
    health: getHealthSnapshot(),
    counts: {
      total: models.length,
      available: models.filter((m) => m.status === "AVAILABLE").length,
      unavailable: models.filter((m) => m.status === "UNAVAILABLE").length,
      configRequired: models.filter((m) => m.status === "CONFIGURATION_REQUIRED").length,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action ?? "");

    if (action === "discover") {
      if (body.provider) {
        const result = await discoverModels(String(body.provider) as ProviderId);
        return NextResponse.json(result);
      }
      const results = await discoverAllConfigured();
      return NextResponse.json({ results });
    }

    if (action === "health") {
      const snaps = await checkAllFromEnv();
      return NextResponse.json({ providers: snaps, cached: getHealthSnapshot() });
    }

    if (action === "benchmark") {
      const provider = String(body.provider) as ProviderId;
      const modelId = String(body.modelId ?? body.model);
      if (!provider || !modelId) {
        return NextResponse.json({ error: "provider and modelId required" }, { status: 400 });
      }
      const result = await benchmarkModel(provider, modelId);
      return NextResponse.json(result);
    }

    if (action === "resolve") {
      const result = modelRegistry.resolve(String(body.model ?? body.query ?? ""));
      return NextResponse.json(result);
    }

    if (action === "benchmark_suite") {
      const registryId = String(body.registryId ?? "");
      const provider = String(body.provider) as ProviderId;
      const modelId = String(body.modelId ?? body.model);
      if (!registryId || !provider || !modelId) {
        return NextResponse.json({ error: "registryId, provider and modelId required" }, { status: 400 });
      }
      const categories = Array.isArray(body.categories) ? (body.categories as BenchmarkCategory[]) : undefined;
      const run = await runBenchmarkSuite(registryId, provider, modelId, categories);
      return NextResponse.json(run);
    }

    if (action === "benchmark_history") {
      const registryId = String(body.registryId ?? "");
      return NextResponse.json({ history: getBenchmarkHistory(registryId) });
    }

    if (action === "benchmark_compare") {
      const a = String(body.registryIdA ?? "");
      const b = String(body.registryIdB ?? "");
      if (!a || !b) return NextResponse.json({ error: "registryIdA and registryIdB required" }, { status: 400 });
      return NextResponse.json(compareModels(a, b));
    }

    if (action === "sandbox_check") {
      const registryId = String(body.registryId ?? "");
      return NextResponse.json(runSandboxChecks(registryId));
    }

    if (action === "sandbox_promote") {
      const registryId = String(body.registryId ?? "");
      return NextResponse.json(promoteFromSandbox(registryId));
    }

    if (action === "set_key") {
      const provider = String(body.provider ?? "") as ProviderId;
      const key = String(body.key ?? "");
      if (!provider || !key) {
        return NextResponse.json({ error: "provider and key required" }, { status: 400 });
      }
      const status = await setProviderKey(provider, key);
      // Immediately try a real discovery call against the provider so the
      // response tells the truth about whether the key actually works,
      // rather than just confirming it was saved.
      let verification: unknown = null;
      try {
        verification = await discoverModels(provider);
      } catch (err) {
        verification = { error: err instanceof Error ? err.message : String(err) };
      }
      return NextResponse.json({ status, verification });
    }

    if (action === "delete_key") {
      const provider = String(body.provider ?? "") as ProviderId;
      if (!provider) return NextResponse.json({ error: "provider required" }, { status: 400 });
      await deleteProviderKey(provider);
      return NextResponse.json({ ok: true, credentials: listCredentialStatus() });
    }

    return NextResponse.json(
      { error: "action must be discover | health | benchmark | resolve | benchmark_suite | benchmark_history | benchmark_compare | sandbox_check | sandbox_promote | set_key | delete_key" },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
