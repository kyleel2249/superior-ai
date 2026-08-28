/**
 * Benchmark Lab — category-based golden-task suite, batch execution
 * across models, historical result tracking, and head-to-head comparison.
 * Builds on the same real-adapter-call pattern as benchmark.ts (never
 * fabricates a pass/fail or a latency number) but adds what a single
 * "reply with ok" health check can't: does this model actually produce
 * usable output for coding vs. research vs. reasoning tasks, tracked
 * over time so routing decisions can rely on more than one data point.
 *
 * Task checks are objective and narrow on purpose — substring/pattern
 * checks on real output, not an LLM grading another LLM's answer (which
 * would just move the fabrication risk one level up).
 */

import type { ProviderId } from "@superior-ai/core";
import { getAdapter } from "./providers";
import { getCredentials } from "./credentials";

export type BenchmarkCategory = "coding" | "research" | "reasoning" | "business" | "creative";

export interface GoldenTask {
  id: string;
  category: BenchmarkCategory;
  prompt: string;
  check: (output: string) => boolean;
  checkDescription: string;
}

export const GOLDEN_TASKS: GoldenTask[] = [
  {
    id: "coding-1",
    category: "coding",
    prompt: "Write a JavaScript function named isEven that returns true if a number is even. Only output the code, no explanation.",
    check: (o) => /function\s+isEven/.test(o) && /%\s*2/.test(o),
    checkDescription: "Output defines isEven and uses modulo 2",
  },
  {
    id: "coding-2",
    category: "coding",
    prompt: "What does the SQL keyword JOIN do? Answer in exactly one sentence.",
    check: (o) => /join/i.test(o) && o.trim().split(/[.!?]/).filter(Boolean).length <= 2,
    checkDescription: "Mentions JOIN, roughly one sentence",
  },
  {
    id: "research-1",
    category: "research",
    prompt: "Name one advantage of a systematic literature review over an ad-hoc one. One sentence.",
    check: (o) => o.trim().length > 10 && o.trim().length < 400,
    checkDescription: "Non-trivial, non-rambling response",
  },
  {
    id: "reasoning-1",
    category: "reasoning",
    prompt: "If all bloops are razzles and all razzles are lazzles, are all bloops lazzles? Answer only Yes or No.",
    check: (o) => /\byes\b/i.test(o) && !/\bno\b/i.test(o),
    checkDescription: "Correctly answers Yes (transitive syllogism)",
  },
  {
    id: "reasoning-2",
    category: "reasoning",
    prompt: "A train leaves at 2pm and arrives at 5pm. How many hours was the trip? Answer with only the number.",
    check: (o) => /\b3\b/.test(o),
    checkDescription: "Correctly answers 3",
  },
  {
    id: "business-1",
    category: "business",
    prompt: "Name one risk of over-relying on a single supplier. One sentence.",
    check: (o) => o.trim().length > 10 && o.trim().length < 400,
    checkDescription: "Non-trivial, non-rambling response",
  },
  {
    id: "creative-1",
    category: "creative",
    prompt: "Write a two-line product tagline for a coffee subscription. Only output the tagline.",
    check: (o) => o.trim().length > 5 && o.trim().length < 200,
    checkDescription: "Produces a short tagline-length output",
  },
];

export interface GoldenTaskResult {
  taskId: string;
  category: BenchmarkCategory;
  passed: boolean;
  latencyMs: number;
  error?: string;
}

export interface BenchmarkRun {
  registryId: string;
  provider: ProviderId;
  modelId: string;
  runAt: string;
  results: GoldenTaskResult[];
  passRate: number; // 0-100
  avgLatencyMs: number;
}

const history = new Map<string, BenchmarkRun[]>();
const MAX_HISTORY_PER_MODEL = 20;

async function runGoldenTask(
  provider: ProviderId,
  modelId: string,
  task: GoldenTask
): Promise<GoldenTaskResult> {
  const start = Date.now();
  const creds = getCredentials(provider);
  if (!creds.apiKey && provider !== "local") {
    return { taskId: task.id, category: task.category, passed: false, latencyMs: 0, error: "CONFIGURATION_REQUIRED" };
  }
  const adapter = getAdapter(provider);
  adapter.setCredentials(creds);
  try {
    const res = await adapter.chat({
      model: modelId,
      messages: [{ role: "user", content: task.prompt }],
      max_tokens: 200,
      temperature: 0,
    });
    const latencyMs = Date.now() - start;
    const passed = task.check(res.content ?? "");
    return { taskId: task.id, category: task.category, passed, latencyMs };
  } catch (err) {
    return {
      taskId: task.id,
      category: task.category,
      passed: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function runBenchmarkSuite(
  registryId: string,
  provider: ProviderId,
  modelId: string,
  categories?: BenchmarkCategory[]
): Promise<BenchmarkRun> {
  const tasks = categories ? GOLDEN_TASKS.filter((t) => categories.includes(t.category)) : GOLDEN_TASKS;
  const results: GoldenTaskResult[] = [];
  for (const task of tasks) {
    results.push(await runGoldenTask(provider, modelId, task));
  }

  const passRate = results.length > 0 ? Math.round((results.filter((r) => r.passed).length / results.length) * 100) : 0;
  const avgLatencyMs =
    results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.latencyMs, 0) / results.length) : 0;

  const run: BenchmarkRun = { registryId, provider, modelId, runAt: new Date().toISOString(), results, passRate, avgLatencyMs };

  const existing = history.get(registryId) ?? [];
  existing.unshift(run);
  history.set(registryId, existing.slice(0, MAX_HISTORY_PER_MODEL));

  return run;
}

export function getBenchmarkHistory(registryId: string): BenchmarkRun[] {
  return history.get(registryId) ?? [];
}

export function getLatestBenchmark(registryId: string): BenchmarkRun | undefined {
  return history.get(registryId)?.[0];
}

export interface ModelComparison {
  registryIdA: string;
  registryIdB: string;
  a: BenchmarkRun | null;
  b: BenchmarkRun | null;
  winner: "a" | "b" | "tie" | "insufficient_data";
  reasoning: string;
}

/** Compares the two models' most recent benchmark runs. Never fabricates a winner without real data on both sides. */
export function compareModels(registryIdA: string, registryIdB: string): ModelComparison {
  const a = getLatestBenchmark(registryIdA) ?? null;
  const b = getLatestBenchmark(registryIdB) ?? null;

  if (!a || !b) {
    return {
      registryIdA,
      registryIdB,
      a,
      b,
      winner: "insufficient_data",
      reasoning: `Missing benchmark data for ${!a ? registryIdA : registryIdB} — run runBenchmarkSuite for both models before comparing.`,
    };
  }

  if (a.passRate !== b.passRate) {
    const winner = a.passRate > b.passRate ? "a" : "b";
    return {
      registryIdA,
      registryIdB,
      a,
      b,
      winner,
      reasoning: `${winner === "a" ? registryIdA : registryIdB} has a higher pass rate (${Math.max(a.passRate, b.passRate)}% vs ${Math.min(a.passRate, b.passRate)}%).`,
    };
  }

  // tie on pass rate — use latency as tiebreaker
  if (a.avgLatencyMs !== b.avgLatencyMs) {
    const winner = a.avgLatencyMs < b.avgLatencyMs ? "a" : "b";
    return {
      registryIdA,
      registryIdB,
      a,
      b,
      winner,
      reasoning: `Equal pass rate (${a.passRate}%) — ${winner === "a" ? registryIdA : registryIdB} is faster on average (${Math.min(a.avgLatencyMs, b.avgLatencyMs)}ms vs ${Math.max(a.avgLatencyMs, b.avgLatencyMs)}ms).`,
    };
  }

  return { registryIdA, registryIdB, a, b, winner: "tie", reasoning: "Identical pass rate and latency." };
}
