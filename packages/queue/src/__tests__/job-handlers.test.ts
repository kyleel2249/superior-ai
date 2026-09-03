import { describe, it, expect } from "vitest";
import { runJobHandler } from "../job-handlers";

describe("runJobHandler('echo') — circular reference regression", () => {
  it("does not return a live reference to the input payload", async () => {
    const payload: Record<string, unknown> = { hello: "world" };
    const result = await runJobHandler("echo", payload);
    expect((result as { data: unknown }).data).not.toBe(payload);
    expect((result as { data: unknown }).data).toEqual({ hello: "world" });
  });

  it("stays JSON-serializable even after being assigned back onto the payload it echoed", async () => {
    // Reproduces exactly how memory-queue's real echo handler wires this up:
    // job.payload.result = await runJobHandler("echo", job.payload).
    // Before the fix, this created payload.result.data === payload (a
    // direct cycle) and JSON.stringify threw on every later read of the job.
    const payload: Record<string, unknown> = { hello: "world" };
    payload.result = await runJobHandler("echo", payload);
    expect(() => JSON.stringify(payload)).not.toThrow();
  });
});
