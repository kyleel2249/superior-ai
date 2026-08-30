/**
 * Autonomous experimentation framework — controlled A/B metadata
 */

export interface Experiment {
  id: string;
  hypothesis: string;
  variants: string[];
  metrics: string[];
  sampleSizeTarget: number;
  status: "draft" | "running" | "completed" | "rolled_back";
  results?: Record<string, number>;
  createdAt: string;
}

const experiments = new Map<string, Experiment>();

export function createExperiment(input: {
  hypothesis: string;
  variants: string[];
  metrics?: string[];
  sampleSizeTarget?: number;
}): Experiment {
  const exp: Experiment = {
    id: `exp_${Date.now().toString(36)}`,
    hypothesis: input.hypothesis,
    variants: input.variants,
    metrics: input.metrics ?? ["quality", "latency", "cost"],
    sampleSizeTarget: input.sampleSizeTarget ?? 100,
    status: "draft",
    createdAt: new Date().toISOString(),
  };
  experiments.set(exp.id, exp);
  return exp;
}

export function startExperiment(id: string): Experiment | null {
  const e = experiments.get(id);
  if (!e) return null;
  e.status = "running";
  return e;
}

export function completeExperiment(
  id: string,
  results: Record<string, number>
): Experiment | null {
  const e = experiments.get(id);
  if (!e) return null;
  e.results = results;
  e.status = "completed";
  return e;
}

export function listExperiments(): Experiment[] {
  return [...experiments.values()].reverse();
}

export interface ExperimentRunResult {
  experiment: Experiment;
  method: "benchmark_history" | "routing_simulation" | "insufficient_data";
  detail: unknown;
}

/**
 * Actually runs an experiment instead of requiring manually-supplied
 * results. Interprets the experiment's two variants as either:
 * (a) real model registry IDs with benchmark history -> real head-to-head
 *     comparison via compareModels (pass rate, latency; never a fabricated
 *     winner if either side lacks data)
 * (b) intelligence levels (FAST/BALANCED/DEEP/etc) -> a real routing
 *     decision comparison via simulateRoutingPolicies against the
 *     experiment's hypothesis text
 * Only supports exactly 2 variants — these comparison primitives are
 * both pairwise, not designed for N-way tests.
 */
export async function runExperiment(id: string): Promise<ExperimentRunResult | null> {
  const exp = experiments.get(id);
  if (!exp) return null;
  if (exp.variants.length !== 2) {
    throw new Error(`runExperiment only supports exactly 2 variants (got ${exp.variants.length}) — compareModels and simulateRoutingPolicies are both pairwise`);
  }

  exp.status = "running";
  const [a, b] = exp.variants;

  // Lazy import to avoid a hard cycle risk if ai-gateway ever grows a
  // dependency back on intelligence — keeps this specific integration
  // point isolated rather than a top-level import.
  const { compareModels, getLatestBenchmark } = await import("@superior-ai/ai-gateway");

  const hasBenchmarkData = Boolean(getLatestBenchmark(a)) && Boolean(getLatestBenchmark(b));

  if (hasBenchmarkData) {
    const comparison = compareModels(a, b);
    const results: Record<string, number> = {
      a_pass_rate: comparison.a?.passRate ?? 0,
      b_pass_rate: comparison.b?.passRate ?? 0,
      a_avg_latency_ms: comparison.a?.avgLatencyMs ?? 0,
      b_avg_latency_ms: comparison.b?.avgLatencyMs ?? 0,
      sample_size_actual: 1, // one comparison run, not exp.sampleSizeTarget — never claim more than actually ran
    };
    completeExperiment(id, results);
    return { experiment: exp, method: "benchmark_history", detail: comparison };
  }

  const { simulateRoutingPolicies } = await import("@superior-ai/ai-gateway");
  const validLevels = ["FAST", "BALANCED", "DEEP", "EXPERT", "MAXIMUM", "SUPREME", "AUTONOMOUS"];
  if (validLevels.includes(a) && validLevels.includes(b)) {
    const sim = simulateRoutingPolicies(exp.hypothesis, a as never, b as never);
    const results: Record<string, number> = {
      same_primary_chosen: sim.samePrimary ? 1 : 0,
      sample_size_actual: 1,
    };
    completeExperiment(id, results);
    return { experiment: exp, method: "routing_simulation", detail: sim };
  }

  exp.status = "draft"; // revert — couldn't actually run this
  return {
    experiment: exp,
    method: "insufficient_data",
    detail: `Neither benchmark history for both "${a}"/"${b}" nor recognized intelligence levels found — run benchmark_suite on both variants first, or use FAST/BALANCED/DEEP/EXPERT/MAXIMUM/SUPREME/AUTONOMOUS as variants.`,
  };
}
