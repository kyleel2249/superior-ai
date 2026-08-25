/**
 * Scenario simulator — best / base / worst / stress cases.
 */

export type ScenarioKind =
  | "best_case"
  | "base_case"
  | "worst_case"
  | "user_defined"
  | "probabilistic"
  | "sensitivity"
  | "stress_test";

export interface ScenarioInput {
  name: string;
  kind: ScenarioKind;
  metric: string;
  baseline: number;
  assumptions?: string[];
  /** Multiplier for best/worst relative to baseline when not user_defined */
  upliftPct?: number;
  downsidePct?: number;
  userValue?: number;
  probability?: number;
}

export interface ScenarioResult {
  id: string;
  name: string;
  kind: ScenarioKind;
  metric: string;
  baseline: number;
  projected: number;
  delta: number;
  deltaPct: number;
  assumptions: string[];
  probability?: number;
  disclaimer: string;
  at: string;
}

export function runScenario(input: ScenarioInput): ScenarioResult {
  const baseline = input.baseline;
  let projected = baseline;
  const assumptions = [...(input.assumptions ?? [])];

  switch (input.kind) {
    case "best_case":
      projected = baseline * (1 + (input.upliftPct ?? 20) / 100);
      assumptions.push(`Best-case uplift ${input.upliftPct ?? 20}%`);
      break;
    case "worst_case":
      projected = baseline * (1 - (input.downsidePct ?? 20) / 100);
      assumptions.push(`Worst-case downside ${input.downsidePct ?? 20}%`);
      break;
    case "stress_test":
      projected = baseline * (1 - (input.downsidePct ?? 40) / 100);
      assumptions.push(`Stress downside ${input.downsidePct ?? 40}%`);
      break;
    case "user_defined":
      projected = input.userValue ?? baseline;
      assumptions.push("User-defined projection");
      break;
    case "sensitivity":
      projected = baseline * (1 + (input.upliftPct ?? 5) / 100);
      assumptions.push(`Sensitivity +${input.upliftPct ?? 5}%`);
      break;
    case "probabilistic":
      projected =
        baseline *
        (1 +
          ((input.upliftPct ?? 10) * (input.probability ?? 0.5) -
            (input.downsidePct ?? 10) * (1 - (input.probability ?? 0.5))) /
            100);
      assumptions.push(`Probabilistic mix p=${input.probability ?? 0.5}`);
      break;
    case "base_case":
    default:
      projected = baseline;
      assumptions.push("Base case = baseline");
  }

  const delta = projected - baseline;
  return {
    id: `sc_${Date.now().toString(36)}`,
    name: input.name,
    kind: input.kind,
    metric: input.metric,
    baseline,
    projected: Math.round(projected * 100) / 100,
    delta: Math.round(delta * 100) / 100,
    deltaPct: baseline ? Math.round((delta / baseline) * 10000) / 100 : 0,
    assumptions,
    probability: input.probability,
    disclaimer: "Scenario estimate only — not a prediction guarantee.",
    at: new Date().toISOString(),
  };
}

export function runScenarioSet(
  name: string,
  metric: string,
  baseline: number
): ScenarioResult[] {
  return (
    ["best_case", "base_case", "worst_case", "stress_test"] as ScenarioKind[]
  ).map((kind) => runScenario({ name: `${name} · ${kind}`, kind, metric, baseline }));
}
