import { describe, it, expect } from "vitest";
import { saveTask, updateTaskStage, getTask, listTasks } from "../tasks";

// This sandbox has no DATABASE_URL, so isDatabaseReady() is false and every
// call below exercises the real in-memory fallback path — the same path
// used by any dev environment without Postgres configured.

describe("saveTask", () => {
  it("creates a task with sensible defaults", async () => {
    const t = await saveTask({ userId: "u1", title: "First task", objective: "Do the thing" });
    expect(t.stage).toBe("planning");
    expect(t.intelligenceLevel).toBe("BALANCED");
    expect(t.completedSteps).toEqual([]);
    expect(t.retryCount).toBe(0);
  });

  it("generates a unique id when none is given", async () => {
    const a = await saveTask({ userId: "u1", title: "A", objective: "a" });
    const b = await saveTask({ userId: "u1", title: "B", objective: "b" });
    expect(a.id).not.toBe(b.id);
  });

  it("upserts: saving again with the same id updates rather than duplicating", async () => {
    const id = `task_test_${Math.random()}`;
    await saveTask({ id, userId: "u1", title: "Original", objective: "orig" });
    const updated = await saveTask({ id, userId: "u1", title: "Renamed", objective: "orig" });
    expect(updated.title).toBe("Renamed");
    expect(updated.id).toBe(id);
  });

  it("preserves completedSteps and retryCount across an upsert (doesn't reset progress)", async () => {
    const id = `task_progress_${Math.random()}`;
    await saveTask({ id, userId: "u1", title: "T", objective: "o", pendingSteps: ["a", "b"] });
    await updateTaskStage(id, { completeStep: "a" });
    const resaved = await saveTask({ id, userId: "u1", title: "T updated", objective: "o" });
    expect(resaved.completedSteps).toContain("a");
  });
});

describe("updateTaskStage", () => {
  it("moves a step from pending to completed", async () => {
    const t = await saveTask({ userId: "u1", title: "T", objective: "o", pendingSteps: ["step1", "step2"] });
    const updated = await updateTaskStage(t.id, { completeStep: "step1" });
    expect(updated?.completedSteps).toEqual(["step1"]);
    expect(updated?.pendingSteps).toEqual(["step2"]);
  });

  it("increments retryCount and records the error message on failure", async () => {
    const t = await saveTask({ userId: "u1", title: "T", objective: "o" });
    const updated = await updateTaskStage(t.id, { error: { message: "boom" } });
    expect(updated?.retryCount).toBe(1);
    expect(Array.isArray(updated?.errors)).toBe(true);
    expect((updated?.errors as { message: string }[])[0]?.message).toBe("boom");
  });

  it("sets completedAt only when completed:true is passed", async () => {
    const t = await saveTask({ userId: "u1", title: "T", objective: "o" });
    expect(t.completedAt).toBeUndefined();
    const updated = await updateTaskStage(t.id, { completed: true });
    expect(updated?.completedAt).toBeInstanceOf(Date);
  });

  it("returns null for a task id that doesn't exist, rather than throwing", async () => {
    expect(await updateTaskStage("task_never_existed", { stage: "done" })).toBeNull();
  });
});

describe("getTask / listTasks", () => {
  it("getTask retrieves a saved task by id", async () => {
    const t = await saveTask({ userId: "u1", title: "Findable", objective: "o" });
    const found = await getTask(t.id);
    expect(found?.title).toBe("Findable");
  });

  it("getTask returns null for an unknown id", async () => {
    expect(await getTask("task_unknown")).toBeNull();
  });

  it("listTasks filters by userId when given", async () => {
    const userId = `user-${Math.random()}`;
    await saveTask({ userId, title: "Mine", objective: "o" });
    await saveTask({ userId: "someone-else", title: "Not mine", objective: "o" });
    const mine = await listTasks(userId);
    expect(mine.every((t) => t.userId === userId)).toBe(true);
    expect(mine.some((t) => t.title === "Mine")).toBe(true);
  });
});
