/**
 * Daily Intelligence — consolidated morning brief for the operator.
 * Uses observed/local state only; never invents metrics or contacts.
 */

import { buildExecutiveBriefing, type ObservedMetric } from "./analytics";
import { funnelSummary, rollupByChannel } from "./funnel-attribution";
import { planMasterLoop } from "./master-loop";

export interface DailyBriefInput {
  product?: string;
  objective?: string;
  observed?: ObservedMetric[];
  highlights?: string[];
  risks?: string[];
  openTasks?: string[];
  memoryNotes?: string[];
}

export interface DailyBrief {
  id: string;
  generatedAt: string;
  title: string;
  sections: Array<{
    id: string;
    title: string;
    items: string[];
  }>;
  executive: ReturnType<typeof buildExecutiveBriefing>;
  funnel: ReturnType<typeof funnelSummary>;
  channels: ReturnType<typeof rollupByChannel>;
  focusToday: string[];
  disclaimer: string;
}

export function generateDailyBrief(input: DailyBriefInput = {}): DailyBrief {
  const product = input.product ?? "SUPERIOR AI workspace";
  const objective = input.objective ?? "Advance growth and product quality";
  const generatedAt = new Date().toISOString();
  const day = generatedAt.slice(0, 10);

  const executive = buildExecutiveBriefing({
    title: `Daily brief — ${day}`,
    period: day,
    observed: input.observed ?? [],
    highlights: input.highlights,
    risks: input.risks,
  });

  const funnel = funnelSummary();
  const channels = rollupByChannel();
  const loop = planMasterLoop(objective);

  const focusToday = [
    `Top objective: ${objective}`,
    input.openTasks?.length
      ? `Open tasks: ${input.openTasks.slice(0, 5).join("; ")}`
      : "Review pipeline and unblock approval-gated actions",
    channels[0]
      ? `Strongest channel by leads: ${channels[0].channel} (${channels[0].leads} leads recorded)`
      : "No attribution events yet — seed or connect analytics",
    "Approve pending social/email publishes only after human review",
  ];

  const sections = [
    {
      id: "snapshot",
      title: "Snapshot",
      items: [
        `Product context: ${product}`,
        executive.narrative,
        funnel.note,
      ],
    },
    {
      id: "kpis",
      title: "KPIs",
      items: executive.kpiStatuses.map(
        (k) =>
          `${k.kpi.name}: ${k.value == null ? "no_data" : k.value} [${k.status}]`
      ),
    },
    {
      id: "funnel",
      title: "Funnel (observed events)",
      items: Object.entries(funnel.totals).map(([k, v]) => `${k}: ${v}`),
    },
    {
      id: "risks",
      title: "Risks",
      items: executive.risks.length ? executive.risks : ["None from supplied data"],
    },
    {
      id: "memory",
      title: "Memory cues",
      items: input.memoryNotes?.length
        ? input.memoryNotes.slice(0, 8)
        : ["No memory notes supplied for this brief"],
    },
    {
      id: "master_loop",
      title: "Master loop stages (planned)",
      items: loop.stages.slice(0, 8).map((s) => `${s.stage}: ${s.summary}`),
    },
  ];

  return {
    id: `daily_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    generatedAt,
    title: `Daily Intelligence — ${day}`,
    sections,
    executive,
    funnel,
    channels,
    focusToday,
    disclaimer:
      "Analytical assistance only. Metrics appear only when observed data is provided. Not a substitute for licensed advice.",
  };
}
