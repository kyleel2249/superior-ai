/**
 * Master AI business loop — connected departments
 */

export const MASTER_LOOP_STAGES = [
  "remember",
  "understand_customer",
  "understand_market",
  "research",
  "analyze_competitors",
  "generate_ideas",
  "validate_ideas",
  "create_product",
  "create_brand",
  "create_software",
  "create_media",
  "publish",
  "traffic",
  "leads",
  "sales",
  "support",
  "analyze_cx",
  "optimize_ops",
  "optimize_costs",
  "retain",
  "collect_data",
  "learn",
  "improve",
  "diversify",
  "expand",
] as const;

export type MasterLoopStage = (typeof MASTER_LOOP_STAGES)[number];

export interface MasterLoopRun {
  id: string;
  objective: string;
  stages: Array<{ stage: MasterLoopStage; summary: string; status: "planned" | "done" | "skipped" }>;
  createdAt: string;
}

export function planMasterLoop(objective: string): MasterLoopRun {
  const stages = MASTER_LOOP_STAGES.map((stage) => ({
    stage,
    summary: `Address "${objective}" at stage: ${stage.replace(/_/g, " ")}`,
    status: "planned" as const,
  }));
  return {
    id: `loop_${Date.now().toString(36)}`,
    objective,
    stages,
    createdAt: new Date().toISOString(),
  };
}

/** Competitive feature matrix (analytical — update as capabilities ship) */
export function competitiveMatrix(): Array<{
  category: string;
  peers: string[];
  superiorFocus: string;
  gapNotes: string;
}> {
  return [
    {
      category: "Coding agents",
      peers: ["Replit", "Bolt", "Claude Code", "Codex"],
      superiorFocus: "Software factory + approval gates + multi-model routing",
      gapNotes: "Deepen live repo tooling and isolated exec (gVisor)",
    },
    {
      category: "Reasoning & research",
      peers: ["ChatGPT", "Claude", "Gemini", "Grok", "Perplexity"],
      superiorFocus: "Council + shared memory + cited research discipline",
      gapNotes: "Continuous web tool depth",
    },
    {
      category: "Design & image",
      peers: ["Photoshop", "Canva", "AI design tools"],
      superiorFocus: "Brand + campaign continuity + honest resolution labels",
      gapNotes: "Full vector/layer editor is roadmap, not complete",
    },
    {
      category: "Video",
      peers: ["Kling", "Google Flow", "traditional NLE"],
      superiorFocus: "Continuity plans + scene orchestration",
      gapNotes: "Native long-form generation depends on providers",
    },
    {
      category: "Business OS",
      peers: ["CRM + MAP + support suites"],
      superiorFocus: "One memory across CX, sales, product, support",
      gapNotes: "Official CRM connectors only where APIs exist",
    },
  ];
}
