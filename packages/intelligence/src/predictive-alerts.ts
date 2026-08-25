/**
 * Predictive alerting — threshold + trend heuristics on provided series.
 */

export type AlertKind =
  | "churn"
  | "revenue"
  | "cash"
  | "inventory"
  | "pipeline"
  | "support"
  | "security"
  | "project"
  | "capacity";

export interface Alert {
  id: string;
  kind: AlertKind;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  confidence: number;
  assumptions: string[];
  at: string;
}

export function evaluateSeriesAlert(input: {
  kind: AlertKind;
  name: string;
  values: number[]; // oldest → newest
  dropPctWarning?: number;
  dropPctCritical?: number;
}): Alert | null {
  const values = input.values;
  if (values.length < 2) return null;
  const prev = values[values.length - 2]!;
  const curr = values[values.length - 1]!;
  if (prev === 0) return null;
  const deltaPct = ((curr - prev) / Math.abs(prev)) * 100;
  const warn = input.dropPctWarning ?? 10;
  const crit = input.dropPctCritical ?? 25;

  // For revenue/pipeline/cash, drop is bad; for churn/support, rise is bad
  const inverse = input.kind === "churn" || input.kind === "support";
  const badMove = inverse ? deltaPct > 0 : deltaPct < 0;
  const mag = Math.abs(deltaPct);
  if (!badMove || mag < warn) return null;

  const severity = mag >= crit ? "critical" : "warning";
  return {
    id: `al_${Date.now().toString(36)}`,
    kind: input.kind,
    severity,
    title: `${input.name} ${inverse ? "increase" : "decline"} detected`,
    message: `${input.name} changed ${deltaPct.toFixed(1)}% (${prev} → ${curr}).`,
    confidence: Math.min(0.9, 0.5 + mag / 100),
    assumptions: [
      "Based solely on provided series",
      "No external market data inferred",
      "Requires operator confirmation before action",
    ],
    at: new Date().toISOString(),
  };
}

const alertLog: Alert[] = [];

export function pushAlert(alert: Alert): Alert {
  alertLog.push(alert);
  if (alertLog.length > 500) alertLog.shift();
  return alert;
}

export function listAlerts(limit = 50): Alert[] {
  return [...alertLog].reverse().slice(0, limit);
}
