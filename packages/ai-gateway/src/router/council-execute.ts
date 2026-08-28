/**
 * Council Execution — actually calls a real model per seat, not just
 * planning role assignments (that's what planCouncil already does).
 *
 * Deliberately does NOT attempt to auto-extract structured "claims" from
 * free-text model output for the disagreement engine — reliably parsing
 * arbitrary LLM prose into subject/assertion/confidence/evidence fields
 * without an LLM-grading-LLM step (which just moves the fabrication risk
 * up a level) isn't something this can do honestly. What it does instead:
 * run each seat's real model call, return the real raw output, real
 * latency, and honest per-seat failure — leaving claim extraction for
 * the disagreement engine as an explicit, separate, human- or
 * caller-supplied step (see packages/agents/src/disagreement.ts).
 */

import { getAdapter } from "../providers";
import { getCredentials } from "../credentials";
import { planCouncil, type CouncilPlan, type CouncilSeat } from "./council";

export interface SeatExecutionResult {
  role: string;
  modelId: string | null;
  provider: string | null;
  output: string | null;
  latencyMs: number;
  error: string | null;
}

export interface CouncilExecutionResult {
  plan: CouncilPlan;
  seatResults: SeatExecutionResult[];
  allSucceeded: boolean;
  note: string;
}

function seatPrompt(seat: CouncilSeat, objective: string): string {
  return `You are the ${seat.role} on an AI advisory council. Your purpose: ${seat.purpose}.

Objective under review: ${objective}

Respond with your independent analysis from this specific role's perspective. Be concise (under 200 words). State your confidence (0-100) at the end as "Confidence: N".`;
}

async function executeSeat(seat: CouncilSeat, objective: string): Promise<SeatExecutionResult> {
  const start = Date.now();
  if (!seat.model) {
    return {
      role: seat.role,
      modelId: null,
      provider: null,
      output: null,
      latencyMs: 0,
      error: "No model assigned to this seat (registry may be empty or unavailable)",
    };
  }

  const provider = seat.model.provider;
  const creds = getCredentials(provider);
  if (!creds.apiKey && provider !== "local") {
    return {
      role: seat.role,
      modelId: seat.model.modelId,
      provider,
      output: null,
      latencyMs: 0,
      error: "CONFIGURATION_REQUIRED",
    };
  }

  try {
    const adapter = getAdapter(provider);
    adapter.setCredentials(creds);
    const res = await adapter.chat({
      model: seat.model.modelId,
      messages: [{ role: "user", content: seatPrompt(seat, objective) }],
      max_tokens: 400,
      temperature: 0.4,
    });
    return {
      role: seat.role,
      modelId: seat.model.modelId,
      provider,
      output: res.content ?? "",
      latencyMs: Date.now() - start,
      error: null,
    };
  } catch (err) {
    return {
      role: seat.role,
      modelId: seat.model.modelId,
      provider,
      output: null,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function executeCouncil(objective: string): Promise<CouncilExecutionResult> {
  const plan = planCouncil(objective);
  const seatResults = await Promise.all(plan.seats.map((seat) => executeSeat(seat, objective)));
  const allSucceeded = seatResults.every((r) => r.error === null);

  return {
    plan,
    seatResults,
    allSucceeded,
    note: allSucceeded
      ? "All seats executed successfully. Structured claim extraction/disagreement resolution is a separate step — see runDisagreementEngine in @superior-ai/agents, which takes explicit structured claims, not raw model prose."
      : "One or more seats failed (commonly CONFIGURATION_REQUIRED — see each seat's error). This is honest per-seat failure, not a synthesized partial result.",
  };
}
