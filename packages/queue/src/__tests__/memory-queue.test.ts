import { describe, it, expect, vi } from "vitest";
import { registerHandler, enqueue, getJob, listJobs, getQueueStats } from "../memory-queue";

async function waitForTerminal(id: string, timeoutMs = 2000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const job = getJob(id);
    if (job && (job.status === "completed" || job.status === "failed")) return job;
    await new Promise((r) => setTimeout(r, 5));
  }
  throw new Error(`job ${id} did not reach a terminal state in time`);
}

describe("memory-queue", () => {
  it("runs a registered handler and marks the job completed", async () => {
    const type = `test-ok-${Math.random()}`;
    const seen: unknown[] = [];
    registerHandler(type, async (job) => {
      seen.push(job.payload);
    });

    const job = enqueue({ type, payload: { hello: "world" } });
    const finished = await waitForTerminal(job.id);

    expect(finished.status).toBe("completed");
    expect(finished.completedAt).toBeDefined();
    expect(seen).toEqual([{ hello: "world" }]);
  });

  it("fails immediately with a clear error when no handler is registered", async () => {
    const type = `test-missing-${Math.random()}`;
    const job = enqueue({ type });
    const finished = await waitForTerminal(job.id);

    expect(finished.status).toBe("failed");
    expect(finished.error).toMatch(/No handler for job type/);
  });

  it("retries a failing handler up to maxAttempts, then marks it failed", async () => {
    const type = `test-retry-${Math.random()}`;
    let calls = 0;
    registerHandler(type, async () => {
      calls += 1;
      throw new Error("boom");
    });

    const job = enqueue({ type, maxAttempts: 3 });
    const finished = await waitForTerminal(job.id);

    expect(finished.status).toBe("failed");
    expect(finished.attempts).toBe(3);
    expect(calls).toBe(3);
    expect(finished.error).toBe("boom");
  });

  it("recovers if the handler succeeds on a retry before maxAttempts", async () => {
    const type = `test-eventual-success-${Math.random()}`;
    let calls = 0;
    registerHandler(type, async () => {
      calls += 1;
      if (calls < 2) throw new Error("transient");
    });

    const job = enqueue({ type, maxAttempts: 5 });
    const finished = await waitForTerminal(job.id);

    expect(finished.status).toBe("completed");
    expect(calls).toBe(2);
  });

  it("processes higher-priority jobs before lower-priority ones once the worker pool is saturated", async () => {
    const type = `test-priority-${Math.random()}`;
    const order: string[] = [];
    const release: Array<() => void> = [];

    registerHandler(type, async (job) => {
      // Blocker jobs (labelled below) hold their worker slot open until we
      // release them, so the pool is genuinely saturated when low/high are
      // enqueued — otherwise both would just start immediately in parallel
      // and prove nothing about ordering.
      if ((job.payload as { blocker?: boolean }).blocker) {
        await new Promise<void>((resolve) => release.push(resolve));
        return;
      }
      order.push(job.id);
    });

    // Saturate the pool (default MAX_CONCURRENCY=4) so subsequent jobs queue.
    const blockers = Array.from({ length: 4 }, () =>
      enqueue({ type, payload: { blocker: true }, priority: 50 })
    );

    const low = enqueue({ type, priority: 1 });
    const high = enqueue({ type, priority: 99 });

    // Give enqueue's synchronous pump() a tick to run and confirm both are
    // still queued, not started, while the pool is saturated.
    await new Promise((r) => setTimeout(r, 5));
    expect(getJob(low.id)?.status).toBe("waiting");
    expect(getJob(high.id)?.status).toBe("waiting");

    // Free exactly one slot — the highest-priority waiter should claim it
    // first. (Once it finishes, it frees its own slot too, so low may start
    // shortly after — we only assert relative order, not exact timing.)
    release.shift()?.();
    await waitForTerminal(high.id);

    // Free remaining slots so low and the blockers can finish.
    release.forEach((fn) => fn());
    await waitForTerminal(low.id);
    await Promise.all(blockers.map((b) => waitForTerminal(b.id)));

    expect(order.indexOf(high.id)).toBeLessThan(order.indexOf(low.id));
  });

  it("getQueueStats and listJobs reflect actual job states, not guesses", async () => {
    const type = `test-stats-${Math.random()}`;
    registerHandler(type, async () => {});
    const jobs = [enqueue({ type }), enqueue({ type }), enqueue({ type })];
    await Promise.all(jobs.map((j) => waitForTerminal(j.id)));

    const stats = getQueueStats();
    expect(stats.completed).toBeGreaterThanOrEqual(3);

    const completedForType = listJobs({ status: "completed" }).filter((j) => j.type === type);
    expect(completedForType).toHaveLength(3);
  });
});
