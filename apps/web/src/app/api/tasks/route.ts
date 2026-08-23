import { NextRequest, NextResponse } from "next/server";
import { saveTask, getTask, listTasks, updateTaskStage, isDatabaseReady } from "@superior-ai/db";
import { createTask, getCheckpoint, listCheckpoints, updateCheckpoint } from "@superior-ai/agents";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    const dbTask = await getTask(id);
    if (dbTask) return NextResponse.json({ ...dbTask, storage: isDatabaseReady() ? "postgres" : "memory" });
    const cp = getCheckpoint(id);
    if (cp) return NextResponse.json({ ...cp, storage: "checkpoint_memory" });
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const dbTasks = await listTasks();
  const cps = listCheckpoints();
  return NextResponse.json({
    storage: isDatabaseReady() ? "postgres" : "memory",
    tasks: dbTasks,
    checkpoints: cps,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.action === "update" && body.taskId) {
    const updated = await updateTaskStage(body.taskId, body.patch ?? {});
    updateCheckpoint(body.taskId, body.patch ?? {});
    return NextResponse.json(updated ?? { error: "not found" }, { status: updated ? 200 : 404 });
  }

  const taskId = body.taskId ?? `task_${Date.now()}`;
  const record = await saveTask({
    id: taskId,
    userId: body.userId ?? "anonymous",
    projectId: body.projectId,
    title: body.title ?? body.objective?.slice(0, 80) ?? "Task",
    objective: body.objective ?? body.title ?? "",
    stage: body.stage ?? "planning",
    intelligenceLevel: body.intelligenceLevel,
    pendingSteps: body.pendingSteps,
    state: body.state,
  });
  createTask({
    taskId: record.id,
    stage: record.stage as "planning",
    pendingSteps: record.pendingSteps,
  });
  return NextResponse.json({ ...record, storage: isDatabaseReady() ? "postgres" : "memory" }, { status: 201 });
}
