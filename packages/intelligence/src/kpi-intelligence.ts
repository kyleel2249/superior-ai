/**
 * KPI Intelligence — detect change, hypothesize causes, suggest next actions.
 * Uses observed values only; does not invent metrics.
 */

export interface KpiPoint {
  kpi: string;
  value: number;
  at: string;
  unit?: string;
}

export interface KpiChange {
  kpi: string;
  previous: number;
  current: number;
  delta: number;
  deltaPct: number;
  direction: "up" | "down" | "flat";
}

export interface KpiInsight {
  change: KpiChange;
  questions: string[];
  possibleCauses: string[];
  suggestedActions: string[];
  severity: "info" | "watch" | "alert";
}

const history = new Map<string, KpiPoint[]>();

export function recordKpi(point: KpiPoint): void {
  const key = point.kpi;
  const arr = history.get(key) ?? [];
  arr.push(point);
  if (arr.length > 500) arr.shift();
  history.set(key, arr);
}

export function listKpiHistory(kpi?: string): KpiPoint[] {
  if (kpi) return [...(history.get(kpi) ?? [])];
  return [...history.values()].flat();
}

export function detectKpiChange(kpi: string): KpiChange | null {
  const arr = history.get(kpi) ?? [];
  if (arr.length < 2) return null;
  const previous = arr[arr.length - 2]!.value;
  const current = arr[arr.length - 1]!.value;
  const delta = current - previous;
  const deltaPct = previous === 0 ? (current === 0 ? 0 : 100) : (delta / previous) * 100;
  const direction: KpiChange["direction"] =
    Math.abs(deltaPct) < 0.5 ? "flat" : delta > 0 ? "up" : "down";
  return {
    kpi,
    previous,
    current,
    delta: Math.round(delta * 1000) / 1000,
    deltaPct: Math.round(deltaPct * 100) / 100,
    direction,
  };
}

export function analyzeKpi(kpi: string): KpiInsight | null {
  const change = detectKpiChange(kpi);
  if (!change) return null;

  const questions = [
    "What changed in the period?",
    "Is this temporary or structural?",
    "What caused it?",
    "What should happen next?",
    "Who should act?",
  ];

  const possibleCauses: string[] = [];
  const suggestedActions: string[] = [];
  let severity: KpiInsight["severity"] = "info";

  if (change.direction === "down" && Math.abs(change.deltaPct) >= 10) {
    severity = "alert";
    possibleCauses.push(
      "Demand drop",
      "Funnel leakage",
      "Product issue",
      "Competitive pressure",
      "Measurement error"
    );
    suggestedActions.push(
      "Inspect funnel stages",
      "Review recent releases",
      "Compare cohort retention",
      "Validate instrumentation"
    );
  } else if (change.direction === "up" && Math.abs(change.deltaPct) >= 10) {
    severity = "watch";
    possibleCauses.push("Campaign lift", "Seasonality", "Pricing change", "Sales execution");
    suggestedActions.push("Attribute by channel", "Check capacity constraints", "Lock in winning plays");
  } else {
    possibleCauses.push("Normal variance");
    suggestedActions.push("Continue monitoring");
  }

  return { change, questions, possibleCauses, suggestedActions, severity };
}
