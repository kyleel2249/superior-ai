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
