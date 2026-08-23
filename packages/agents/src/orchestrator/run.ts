/**
 * apps/web/src/app/api/orchestrate/route.ts calls
 * runOrchestrator({ objective, mode, region, product, audience,
 * competitorUrls, userId, projectId }) — this function didn't exist.
 *
 * This is a deterministic planner: it selects the relevant pack(s)/agents
 * for the objective and produces a step-by-step plan. It does not call an
 * LLM or execute any tool itself — "mode: execute_safe" (the route's
 * default) means "plan only, no side effects," which this honors by
 * construction rather than by a runtime check.
 */
import { listCatalog, type AgentPackManifest } from "../packs/registry";

export interface OrchestratorInput {
  objective: string;
  mode?: "execute_safe" | "plan_only";
  region?: string;
  product?: string;
  audience?: string;
  competitorUrls?: string[];
  userId?: string;
  projectId?: string;
}

export interface OrchestratorStep {
  order: number;
  agent: string;
  action: string;
}

export interface OrchestratorResult {
  objective: string;
  mode: string;
  packsConsidered: string[];
  agentsAssigned: string[];
  steps: OrchestratorStep[];
  notes: string[];
}

const STOPWORDS = new Set([
  "a", "an", "the", "for", "our", "your", "and", "or", "of", "to", "in", "on",
  "with", "is", "are", "be", "we", "us", "it", "this", "that", "at", "by",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function keywordMatch(objective: string, pack: AgentPackManifest): boolean {
  const words = tokenize(objective);
  if (words.length === 0) return false;
  const haystack = [pack.description, pack.category, pack.name].join(" ").toLowerCase();
  const haystackTokens = new Set(tokenize(haystack));
  const matches = words.filter((w) => haystackTokens.has(w)).length;
  return matches >= 1;
}

export async function runOrchestrator(input: OrchestratorInput): Promise<OrchestratorResult> {
  if (!input.objective?.trim()) throw new Error("objective is required");

  const catalog = listCatalog();
  const matched = catalog.filter((p) => keywordMatch(input.objective, p));
  const packsConsidered = (matched.length > 0 ? matched : catalog).map((p) => p.id);

  const agentsAssigned = Array.from(
    new Set((matched.length > 0 ? matched : catalog).flatMap((p) => p.agents))
  );

  const steps: OrchestratorStep[] = agentsAssigned.map((agent, i) => ({
    order: i + 1,
    agent,
    action: `${agent} works the objective: "${input.objective}"${input.product ? ` for product "${input.product}"` : ""}${input.audience ? ` targeting "${input.audience}"` : ""}.`,
  }));

  const notes: string[] = [
    `mode=${input.mode ?? "execute_safe"}: this is a plan only — no external tools, LLM calls, or writes were executed.`,
  ];
  if (input.competitorUrls?.length) {
    notes.push(`${input.competitorUrls.length} competitor URL(s) noted for research but not fetched by this planner.`);
  }
  if (agentsAssigned.length === 0) {
    notes.push("No matching agent pack found for this objective — install a relevant pack or refine the objective.");
  }

  return {
    objective: input.objective,
    mode: input.mode ?? "execute_safe",
    packsConsidered,
    agentsAssigned,
    steps,
    notes,
  };
}
