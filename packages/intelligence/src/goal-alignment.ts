/**
 * Business goal alignment — link work to goals/KPIs
 */

export interface BusinessGoal {
  id: string;
  level: "company" | "department" | "project";
  title: string;
  kpi?: string;
  target?: number;
  current?: number;
}

export interface AlignmentResult {
  goalId: string;
  taskSummary: string;
  contribution: "direct" | "indirect" | "unclear";
  score: number;
  note: string;
}

const goals = new Map<string, BusinessGoal>();

export function upsertGoal(g: BusinessGoal): BusinessGoal {
  goals.set(g.id, g);
  return g;
}

export function listGoals(): BusinessGoal[] {
  return [...goals.values()];
}

export function alignTaskToGoals(taskSummary: string): AlignmentResult[] {
  const lower = taskSummary.toLowerCase();
  return listGoals().map((g) => {
    const hit =
      lower.includes(g.title.toLowerCase().slice(0, 12)) ||
      (g.kpi && lower.includes(g.kpi.toLowerCase()));
    const contribution = hit ? "direct" : lower.length > 20 ? "indirect" : "unclear";
    const score = contribution === "direct" ? 0.85 : contribution === "indirect" ? 0.4 : 0.15;
    return {
      goalId: g.id,
      taskSummary: taskSummary.slice(0, 120),
      contribution,
      score,
      note:
        contribution === "direct"
          ? "Lexical match to goal/KPI"
          : "No strong lexical match — review manually",
    };
  });
}
