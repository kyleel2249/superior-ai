/**
 * Phase 4 requirement: ties together Task Classifier, Model Ensemble, Critic
 * Agent, Verification Agent, and Synthesis Agent across the 5 modes the spec
 * names: Single Model, Multi Model, Expert Council, Supreme, Autonomous.
 *
 * Providers are supplied by the caller (not resolved from the model registry
 * inside this module) so the orchestration logic — parallelism, critique,
 * synthesis, the autonomous refinement loop — can be exercised in tests
 * against fake adapters, independent of which real providers happen to be
 * configured with API keys in a given deployment.
 */
import type { ProviderId } from "@superior-ai/core";
import type { ChatCompletionRequest } from "../providers/base";
import { runEnsemble, type AdapterLookup, type EnsembleResult } from "./ensemble";
import { critiqueResponses, type CritiqueResult } from "./critic";
import { verifyResponse, type VerificationResult } from "./verification";
import { synthesizeResponses, type SynthesisResult } from "./synthesis";
import { classifyTask, type TaskClassification } from "./classifier";

export type CouncilMode = "single" | "multi" | "council" | "supreme" | "autonomous";

export interface CouncilInput {
  prompt: string;
  providers: ProviderId[];
  mode: CouncilMode;
  model?: string; // model id to request from each provider; defaults to "auto" style pass-through
}

export interface CouncilResult {
  mode: CouncilMode;
  classification: TaskClassification;
  ensemble: EnsembleResult;
  critique: CritiqueResult;
  verification: VerificationResult;
  synthesis: SynthesisResult;
  refinementPasses: number;
}

const MAX_AUTONOMOUS_PASSES = 2;

export async function runCouncil(input: CouncilInput, getAdapter: AdapterLookup): Promise<CouncilResult> {
  const classification = classifyTask(input.prompt);

  // "single" mode still runs through the same pipeline with exactly one
  // provider, so the response shape is identical regardless of mode —
  // no special-cased duplicate code path that could drift out of sync.
  const providers = input.mode === "single" ? input.providers.slice(0, 1) : input.providers;
  if (providers.length === 0) throw new Error("At least one provider is required");

  const baseRequest: ChatCompletionRequest = {
    model: input.model ?? "auto",
    messages: [{ role: "user", content: input.prompt }],
  };

  let ensemble = await runEnsemble(providers, baseRequest, getAdapter);
  let critique = critiqueResponses(ensemble.members);
  let synthesis = synthesizeResponses(ensemble.members, critique);
  let verification = verifyResponse(synthesis.finalText);
  let refinementPasses = 0;

  if (input.mode === "autonomous") {
    while (refinementPasses < MAX_AUTONOMOUS_PASSES && (critique.conflict || verification.needsReview)) {
      refinementPasses += 1;
      const refinementPrompt =
        `${input.prompt}\n\n[Refinement pass ${refinementPasses}: prior responses disagreed or contained ` +
        `unqualified absolute claims alongside specific figures. Give a single, precise, appropriately hedged answer.]`;
      ensemble = await runEnsemble(providers, { ...baseRequest, messages: [{ role: "user", content: refinementPrompt }] }, getAdapter);
      critique = critiqueResponses(ensemble.members);
      synthesis = synthesizeResponses(ensemble.members, critique);
      verification = verifyResponse(synthesis.finalText);
    }
  }

  return { mode: input.mode, classification, ensemble, critique, verification, synthesis, refinementPasses };
}
