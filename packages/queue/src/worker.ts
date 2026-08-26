/**
 * Background worker entry — registers orchestrate + research handlers
 * Run: npx tsx packages/queue/src/worker.ts  (or via scripts/worker.mjs)
 *
 * NOTE: this registers handlers by calling agent functions directly, as a
 * standalone alternative to redis-queue.ts's initQueue() (which dispatches
 * the same job types through job-handlers.ts's runJobHandler switch). Both
 * paths exist and both work; exported here under distinct names
 * (startStandaloneWorker / enqueueOrchestrationViaWorker) rather than
 * removed, since this file's direct-registration approach is a real,
 * independently useful capability for running a worker process.
 */

import { registerHandler, initQueue, enqueue } from "./redis-queue";

export async function startStandaloneWorker(): Promise<void> {
  const { backend } = await initQueue();
  console.log(`[worker] starting backend=${backend}`);

  registerHandler("orchestrate_async", async (job) => {
    const objective = String(job.payload.objective ?? "");
    if (!objective) throw new Error("objective required");
    // Lazy import to avoid circular deps at module load
    const { runOrchestrator } = await import("@superior-ai/agents");
    const result = await runOrchestrator({
      objective,
      product: job.payload.product as string | undefined,
      audience: job.payload.audience as string | undefined,
      region: job.payload.region as string | undefined,
      competitorUrls: job.payload.competitorUrls as string[] | undefined,
      userId: job.payload.userId as string | undefined,
      projectId: job.payload.projectId as string | undefined,
      mode: (job.payload.mode as "execute_safe") ?? "execute_safe",
    });
    job.payload.result = result;
  });

  registerHandler("url_audit_async", async (job) => {
    const url = String(job.payload.url ?? "");
    const { runSafeUrlAudit } = await import("@superior-ai/agents");
    job.payload.result = await runSafeUrlAudit(url);
  });

  registerHandler("echo", async (job) => {
    job.payload.result = { echoed: true, at: new Date().toISOString(), ...job.payload };
  });

  console.log("[worker] handlers registered: orchestrate_async, url_audit_async, echo");
}

export function enqueueOrchestrationViaWorker(payload: Record<string, unknown>, priority = 70) {
  return enqueue({
    type: "orchestrate_async",
    payload,
    lane: "long_running",
    priority,
    maxAttempts: 2,
  });
}

// Allow direct run
const isMain = typeof require !== "undefined" && require.main === module;
if (isMain) {
  startStandaloneWorker().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
