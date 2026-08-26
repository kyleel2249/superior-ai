/**
 * AI Workforce P&L — illustrative rollup from observed economics events.
 */

import { listEconomics, economicsRollup } from "./ai-economics";

export interface WorkforcePnL {
  periodLabel: string;
  tasksCompleted: number;
  providerCostUsd: number;
  estimatedLaborValueUsd: number;
  estimatedNetUsd: number;
  avgQuality: number | null;
  humanHoursAvoided: number;
  byDepartment: Array<{ department: string; cost: number; tasks: number }>;
  disclaimer: string;
  at: string;
}

export function computeWorkforcePnL(periodLabel = "all_time"): WorkforcePnL {
  const rollup = economicsRollup();
  const events = listEconomics(5000);
  const byDept = new Map<string, { cost: number; tasks: number }>();
  for (const e of events) {
    const d = e.department ?? "unassigned";
    const cur = byDept.get(d) ?? { cost: 0, tasks: 0 };
    cur.cost += e.providerCostUsd;
    cur.tasks += 1;
    byDept.set(d, cur);
  }
  return {
    periodLabel,
    tasksCompleted: rollup.tasks,
    providerCostUsd: rollup.providerCostUsd,
    estimatedLaborValueUsd: rollup.estimatedLaborValueUsd,
    estimatedNetUsd:
      Math.round((rollup.estimatedLaborValueUsd - rollup.providerCostUsd) * 100) / 100,
    avgQuality: rollup.avgQuality,
    humanHoursAvoided: rollup.humanHoursAvoided,
    byDepartment: [...byDept.entries()].map(([department, v]) => ({
      department,
      cost: Math.round(v.cost * 100) / 100,
      tasks: v.tasks,
    })),
    disclaimer:
      "Illustrative P&L using recorded provider costs and a fixed labor-hour proxy. Not audited financials.",
    at: new Date().toISOString(),
  };
}
