import { NextRequest, NextResponse } from "next/server";
import {
  createFactoryTask,
  advanceFactoryTask,
  getFactoryTask,
  listFactoryTasks,
  factoryInspectRepo,
  factoryValidateCode,
  runFactoryPipeline,
  runFullSoftwareFactory,
  generateSoftwareSpecs,
  factoryProposeDeploy,
} from "@superior-ai/agents";
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
    const action = String(body.action ?? "create");

    if (action === "create") {
      const task = createFactoryTask({
        objective: String(body.objective ?? "Untitled software task"),
        repoUrl: body.repoUrl,
        localPath: body.localPath,
      });
      audit({
        action: "factory.create",
        outcome: "success",
        resourceType: "software_factory",
        resourceId: task.id,
        meta: { objective: task.objective },
      });
      return NextResponse.json(task, { status: 201 });
    }

    if (action === "pipeline" || action === "full") {
      const runner = action === "full" ? runFullSoftwareFactory : runFactoryPipeline;
      const task = await runner({
        objective: String(body.objective ?? "Untitled"),
        localPath: body.localPath,
        repoUrl: body.repoUrl,
        snippet: body.snippet,
        approveMutations: body.approveMutations === true,
        includeDeployPlan: body.includeDeployPlan === true,
      } as Parameters<typeof runFullSoftwareFactory>[0]);
      return NextResponse.json(task, { status: 201 });
    }

    if (action === "specs") {
      return NextResponse.json({
        artifacts: generateSoftwareSpecs(String(body.objective ?? "app")),
      });
    }

    if (action === "deploy_plan" && body.taskId) {
      const task = factoryProposeDeploy(String(body.taskId));
      if (!task) return NextResponse.json({ error: "not found" }, { status: 404 });
      return NextResponse.json(task);
    }

    if (action === "inspect" && body.taskId) {
      const task = await factoryInspectRepo(body.taskId, body.localPath);
      if (!task) return NextResponse.json({ error: "not found" }, { status: 404 });
      return NextResponse.json(task);
    }

    if (action === "validate" && body.taskId && body.code) {
      const task = await factoryValidateCode(body.taskId, {
        language: body.language ?? "javascript",
        code: String(body.code),
        execute: body.execute === true,
      });
      if (!task) return NextResponse.json({ error: "not found" }, { status: 404 });
      return NextResponse.json(task);
    }

    if (action === "advance" && body.taskId) {
      const task = advanceFactoryTask(body.taskId, body);
      if (!task) return NextResponse.json({ error: "not found" }, { status: 404 });
      return NextResponse.json(task);
    }

    return NextResponse.json(
      { error: "action must be create | pipeline | full | specs | deploy_plan | inspect | validate | advance" },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
