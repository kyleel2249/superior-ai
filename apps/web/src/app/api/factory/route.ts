import { NextRequest, NextResponse } from "next/server";
import { createFactoryTask, advanceFactoryTask, getFactoryTask, listFactoryTasks } from "@superior-ai/agents";
import { audit } from "@superior-ai/audit";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    const task = getFactoryTask(id);
    if (!task) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(task);
  }
  return NextResponse.json({ tasks: listFactoryTasks() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action === "create" || !body.action) {
      const task = createFactoryTask({
        objective: String(body.objective ?? ""),
        repoUrl: body.repoUrl,
      });
      audit({
        action: "orchestrate.run",
        outcome: "success",
        resourceType: "software_factory",
        resourceId: task.id,
        meta: { objective: task.objective },
      });
      return NextResponse.json(task, { status: 201 });
    }
    if (body.action === "advance" && body.taskId) {
      const task = advanceFactoryTask(body.taskId, body);
      if (!task) return NextResponse.json({ error: "not found" }, { status: 404 });
      return NextResponse.json(task);
    }
    return NextResponse.json({ error: "action must be create | advance" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
