/**
 * Analytics, BI & Decision System
 * Never invents KPI values. Accepts observed metrics only.
 */

export type KpiDirection = "higher_better" | "lower_better";

export interface KpiDefinition {
  id: string;
  name: string;
  category: "traffic" | "acquisition" | "activation" | "revenue" | "retention" | "product" | "ops";
  direction: KpiDirection;
  unit: string;
  description: string;
}

export interface ObservedMetric {
  kpiId: string;
  value: number;
  period: string;
  source: string;
  observedAt: string;
}

export interface KpiStatus {
  kpi: KpiDefinition;
  value: number | null;
  status: "ok" | "watch" | "alert" | "no_data";
  note: string;
}

export interface DecisionRecord {
  id: string;
  question: string;
  options: Array<{ id: string; label: string; pros: string[]; cons: string[]; risks: string[] }>;
  recommendation: string;
  assumptions: string[];
  evidenceRefs: string[];
  metricsUsed: string[];
  owner: string;
  createdAt: string;
  status: "draft" | "accepted" | "rejected" | "deferred";
}

export interface ExecutiveBriefing {
  id: string;
  title: string;
  period: string;
  highlights: string[];
  risks: string[];
  decisionsNeeded: string[];
  kpiStatuses: KpiStatus[];
  narrative: string;
  disclaimer: string;
}

export const DEFAULT_KPIS: KpiDefinition[] = [
  { id: "sessions", name: "Sessions", category: "traffic", direction: "higher_better", unit: "count", description: "Site or app sessions" },
  { id: "leads", name: "Leads", category: "acquisition", direction: "higher_better", unit: "count", description: "Captured leads" },
  { id: "sql", name: "SQLs", category: "acquisition", direction: "higher_better", unit: "count", description: "Sales-qualified leads" },
  { id: "cvr", name: "Conversion rate", category: "activation", direction: "higher_better", unit: "%", description: "Visitor → lead or trial" },
  { id: "pipeline", name: "Pipeline value", category: "revenue", direction: "higher_better", unit: "currency", description: "Open pipeline" },
  { id: "revenue", name: "Revenue", category: "revenue", direction: "higher_better", unit: "currency", description: "Closed revenue" },
  { id: "churn", name: "Churn rate", category: "retention", direction: "lower_better", unit: "%", description: "Logo or revenue churn" },
  { id: "nps", name: "NPS", category: "retention", direction: "higher_better", unit: "score", description: "Net promoter (surveyed)" },
  { id: "uptime", name: "Uptime", category: "ops", direction: "higher_better", unit: "%", description: "Service availability" },
  { id: "cycle_time", name: "Delivery cycle time", category: "product", direction: "lower_better", unit: "days", description: "Idea → ship" },
];

export function listKpis(): KpiDefinition[] {
  return [...DEFAULT_KPIS];
}

export function evaluateKpis(
  observed: ObservedMetric[],
  thresholds?: Partial<Record<string, { watch: number; alert: number }>>
): KpiStatus[] {
  return DEFAULT_KPIS.map((kpi) => {
    const rows = observed.filter((o) => o.kpiId === kpi.id);
    if (!rows.length) {
      return {
        kpi,
        value: null,
        status: "no_data",
        note: "No observed metric provided — not inferred",
      };
    }
    const latest = rows.sort((a, b) => b.observedAt.localeCompare(a.observedAt))[0]!;
    const th = thresholds?.[kpi.id];
    let status: KpiStatus["status"] = "ok";
    if (th) {
      if (kpi.direction === "higher_better") {
        if (latest.value < th.alert) status = "alert";
        else if (latest.value < th.watch) status = "watch";
      } else {
        if (latest.value > th.alert) status = "alert";
        else if (latest.value > th.watch) status = "watch";
      }
    }
    return {
      kpi,
      value: latest.value,
      status,
      note: `Source: ${latest.source} · ${latest.period}`,
    };
  });
}

export function buildExecutiveBriefing(input: {
  title?: string;
  period?: string;
  observed?: ObservedMetric[];
  highlights?: string[];
  risks?: string[];
  decisionsNeeded?: string[];
}): ExecutiveBriefing {
  const kpiStatuses = evaluateKpis(input.observed ?? []);
  const withData = kpiStatuses.filter((k) => k.value != null);
  const noData = kpiStatuses.filter((k) => k.value == null);

  const highlights = input.highlights?.length
    ? input.highlights
    : withData.length
      ? withData.map((k) => `${k.kpi.name}: ${k.value} (${k.status})`)
      : ["No observed metrics supplied for this period"];

  const risks = input.risks?.length
    ? input.risks
    : [
        ...kpiStatuses.filter((k) => k.status === "alert").map((k) => `${k.kpi.name} in alert`),
        ...(noData.length ? [`${noData.length} KPIs lack data`] : []),
      ];

  const narrative = [
    `Executive briefing${input.period ? ` for ${input.period}` : ""}.`,
    `${withData.length} KPIs with observed data; ${noData.length} without.`,
    risks.length ? `Risks: ${risks.join("; ")}.` : "No alert risks from supplied data.",
    "Decisions should not rely on missing metrics.",
  ].join(" ");

  return {
    id: `brief_${Date.now().toString(36)}`,
    title: input.title ?? "Executive briefing",
    period: input.period ?? new Date().toISOString().slice(0, 10),
    highlights,
    risks,
    decisionsNeeded: input.decisionsNeeded ?? ["Confirm data sources for missing KPIs"],
    kpiStatuses,
    narrative,
    disclaimer:
      "Analytical assistance only. KPI values appear only when provided as observed metrics. Not licensed financial advice.",
  };
}

const decisions = new Map<string, DecisionRecord>();

export function createDecision(input: {
  question: string;
  options: DecisionRecord["options"];
  recommendation: string;
  assumptions?: string[];
  evidenceRefs?: string[];
  metricsUsed?: string[];
  owner?: string;
}): DecisionRecord {
  const rec: DecisionRecord = {
    id: `dec_${Date.now().toString(36)}`,
    question: input.question,
    options: input.options,
    recommendation: input.recommendation,
    assumptions: input.assumptions ?? [],
    evidenceRefs: input.evidenceRefs ?? [],
    metricsUsed: input.metricsUsed ?? [],
    owner: input.owner ?? "executive",
    createdAt: new Date().toISOString(),
    status: "draft",
  };
  decisions.set(rec.id, rec);
  return rec;
}

export function listDecisions(): DecisionRecord[] {
  return [...decisions.values()];
}

export function setDecisionStatus(
  id: string,
  status: DecisionRecord["status"]
): DecisionRecord | null {
  const d = decisions.get(id);
  if (!d) return null;
  d.status = status;
  return d;
}

export function funnelAnalyticsTemplate(): Array<{ stage: string; metric: string; note: string }> {
  return [
    { stage: "Traffic", metric: "sessions", note: "Requires analytics connector" },
    { stage: "Leads", metric: "leads", note: "CRM or form source" },
    { stage: "SQL", metric: "sql", note: "CRM stage definition" },
    { stage: "Opportunity", metric: "pipeline", note: "CRM deals" },
    { stage: "Revenue", metric: "revenue", note: "Billing / finance source" },
    { stage: "Retention", metric: "churn", note: "Product analytics / billing" },
  ];
}
