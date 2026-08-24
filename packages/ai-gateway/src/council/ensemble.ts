/**
 * Phase 4 requirement: Model Ensemble. Runs the same request against
 * multiple providers in parallel (Promise.allSettled — one provider being
 * down or unconfigured never fails the whole ensemble) and returns every
 * result, success or failure, with per-call timing.
 *
 * Takes an adapter lookup function rather than importing getAdapter directly,
 * so the orchestration logic (parallelism, failure isolation, timing) can be
 * exercised in tests with fake adapters instead of requiring live provider
 * credentials this environment doesn't have.
 */
import type { ProviderId } from "@superior-ai/core";
import type { BaseProviderAdapter, ChatCompletionRequest, ChatCompletionResponse } from "../providers/base";

export interface EnsembleMember {
  provider: ProviderId;
  ok: boolean;
  response?: ChatCompletionResponse;
  error?: string;
  latencyMs: number;
}

export interface EnsembleResult {
  members: EnsembleMember[];
  succeededCount: number;
  failedCount: number;
}

export type AdapterLookup = (provider: ProviderId) => BaseProviderAdapter;

export async function runEnsemble(
  providers: ProviderId[],
  req: ChatCompletionRequest,
  getAdapter: AdapterLookup
): Promise<EnsembleResult> {
  const settled = await Promise.allSettled(
    providers.map(async (provider) => {
      const start = Date.now();
      const adapter = getAdapter(provider);
      const response = await adapter.chat(req);
      return { provider, response, latencyMs: Date.now() - start };
    })
  );

  const members: EnsembleMember[] = settled.map((result, i) => {
    const provider = providers[i]!;
    if (result.status === "fulfilled") {
      return { provider, ok: true, response: result.value.response, latencyMs: result.value.latencyMs };
    }
    return {
      provider,
      ok: false,
      error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      latencyMs: -1,
    };
  });

  return {
    members,
    succeededCount: members.filter((m) => m.ok).length,
    failedCount: members.filter((m) => !m.ok).length,
  };
}
