/**
 * Multi-step orchestrator.
 *
 * - plan_only / execute_safe (default): deterministic pack matching + step plan.
 *   No side effects, no LLM calls.
 * - execute: builds the plan, then (when a chat callable is provided) asks a
 *   model to synthesize a concrete first-action plan. The caller (API route)
 *   supplies the chat function so this package stays free of hard provider
 *   coupling and never fakes a model response.
 */
import { listCatalog, type AgentPackManifest } from "../packs/registry";

export interface OrchestratorInput {
  objective: string;
  mode?: "execute_safe" | "plan_only" | "execute";
  region?: string;
  product?: string;
  audience?: string;
  competitorUrls?: string[];
  userId?: string;
  projectId?: string;
  chat?: (messages: Array<{ role: string; content: string }>) => Promise<{
    content: string;
    model?: string;
    provider?: string;
    reason?: string;
  }>;
}

export interface OrchestratorStep {
  order: number;
  agent: string;
  action: string;
  status: "planned" | "synthesized" | "blocked";
}

export interface OrchestratorResult {
  objective: string;
  mode: string;
  packsConsidered: string[];
  agentsAssigned: string[];
  steps: OrchestratorStep[];
  notes: string[];
  synthesis?: {
    content: string;
    model?: string;
    provider?: string;
    reason?: string;
  };
  executed: boolean;
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
  return words.some((w) => haystackTokens.has(w));
}

export async function runOrchestrator(input: OrchestratorInput): Promise<OrchestratorResult> {
  if (!input.objective?.trim()) throw new Error("objective is required");

  const mode = input.mode ?? "execute_safe";
  const catalog = listCatalog();
  const matched = catalog.filter((p) => keywordMatch(input.objective, p));
  const packs = matched.length > 0 ? matched : catalog.slice(0, 3);
  const packsConsidered = packs.map((p) => p.id);

  const agentsAssigned = Array.from(new Set(packs.flatMap((p) => p.agents)));

  const steps: OrchestratorStep[] = agentsAssigned.map((agent, i) => ({
    order: i + 1,
    agent,
    action: `${agent} addresses: "${input.objective}"${
      input.product ? ` (product: ${input.product})` : ""
    }${input.audience ? ` (audience: ${input.audience})` : ""}.`,
    status: "planned" as const,
  }));

  const notes: string[] = [];
  if (mode === "execute_safe" || mode === "plan_only") {
    notes.push(
      `mode=${mode}: plan only — no external tools, LLM calls, or writes were executed.`
    );
  }
  if (input.competitorUrls?.length) {
    notes.push(
      `${input.competitorUrls.length} competitor URL(s) noted for research but not fetched by the planner.`
    );
  }
  if (agentsAssigned.length === 0) {
    notes.push(
      "No matching agent pack found for this objective — install a relevant pack or refine the objective."
    );
  }

  let synthesis: OrchestratorResult["synthesis"];
  let executed = false;

  if (mode === "execute") {
    if (!input.chat) {
      notes.push(
        "mode=execute requested but no chat callable was provided by the API layer — returning plan only."
      );
    } else {
      try {
        const planText = steps
          .map((s) => `${s.order}. [${s.agent}] ${s.action}`)
          .join("\n");
        const result = await input.chat([
          {
            role: "system",
            content:
              "You are the SUPERIOR AI orchestrator. Given an objective and assigned specialist agents, produce a concrete, ordered execution plan with clear deliverables. Be specific. Do not invent tool results, URLs, metrics, or contacts. Label estimates clearly.",
          },
          {
            role: "user",
            content: [
              `Objective: ${input.objective}`,
              input.product ? `Product: ${input.product}` : null,
              input.audience ? `Audience: ${input.audience}` : null,
              input.region ? `Region: ${input.region}` : null,
              input.competitorUrls?.length
                ? `Competitor URLs (not yet fetched): ${input.competitorUrls.join(", ")}`
                : null,
              "",
              "Assigned agents / planned steps:",
              planText,
              "",
              "Produce: (1) refined plan with owner agent per step, (2) first concrete actions, (3) risks or missing information.",
            ]
              .filter(Boolean)
              .join("\n"),
          },
        ]);
        synthesis = {
          content: result.content,
          model: result.model,
          provider: result.provider,
          reason: result.reason,
        };
        executed = true;
        for (const s of steps) s.status = "synthesized";
        notes.push(
          `mode=execute: synthesized plan via ${result.provider ?? "model"} / ${result.model ?? "unknown"}.`
        );
      } catch (err) {
        notes.push(
          `mode=execute synthesis failed honestly: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
        for (const s of steps) s.status = "blocked";
      }
    }
  }

  return {
    objective: input.objective,
    mode,
    packsConsidered,
    agentsAssigned,
    steps,
    notes,
    synthesis,
    executed,
  };
}
