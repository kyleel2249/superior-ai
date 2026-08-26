/**
 * Proactive insights — only when enabled; uses provided signals.
 */

export interface ProactiveInsight {
  id: string;
  category: "risk" | "opportunity" | "deadline" | "anomaly" | "unfinished" | "customer";
  title: string;
  detail: string;
  priority: "low" | "medium" | "high";
  at: string;
}

export function generateProactiveInsights(input: {
  enabled?: boolean;
  openIncidents?: number;
  queueDepth?: number;
  churnSignal?: boolean;
  unfinishedTasks?: string[];
  deadlineSoon?: string[];
  opportunityCount?: number;
}): { enabled: boolean; insights: ProactiveInsight[] } {
  if (input.enabled === false) {
    return { enabled: false, insights: [] };
  }
  const at = new Date().toISOString();
  const insights: ProactiveInsight[] = [];
  if ((input.openIncidents ?? 0) > 0) {
    insights.push({
      id: "pi_inc",
      category: "risk",
      title: "Open incidents need attention",
      detail: `${input.openIncidents} incident(s) still open.`,
      priority: "high",
      at,
    });
  }
  if ((input.queueDepth ?? 0) > 20) {
    insights.push({
      id: "pi_q",
      category: "anomaly",
      title: "Queue depth elevated",
      detail: `Queue depth ${input.queueDepth} — consider capacity or priority routing.`,
      priority: "medium",
      at,
    });
  }
  if (input.churnSignal) {
    insights.push({
      id: "pi_churn",
      category: "customer",
      title: "Churn pressure signal",
      detail: "Operator-supplied churn signal is active.",
      priority: "high",
      at,
    });
  }
  for (const t of input.unfinishedTasks ?? []) {
    insights.push({
      id: `pi_u_${insights.length}`,
      category: "unfinished",
      title: "Unfinished work",
      detail: t,
      priority: "medium",
      at,
    });
  }
  for (const d of input.deadlineSoon ?? []) {
    insights.push({
      id: `pi_d_${insights.length}`,
      category: "deadline",
      title: "Upcoming deadline",
      detail: d,
      priority: "high",
      at,
    });
  }
  if ((input.opportunityCount ?? 0) > 0) {
    insights.push({
      id: "pi_opp",
      category: "opportunity",
      title: "Opportunities available",
      detail: `${input.opportunityCount} opportunity item(s) in engine.`,
      priority: "low",
      at,
    });
  }
  return { enabled: true, insights };
}
