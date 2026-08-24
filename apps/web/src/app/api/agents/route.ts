import { NextRequest, NextResponse } from "next/server";
import {
  listAgentDefinitions,
  createAgentInstance,
  listAgentInstances,
  runAgentTask,
  agentCallAgent,
  agentUseTool,
  agentUseMemory,
  createAgentTask,
  assignTask,
  completeTask,
  failTask,
  retryTask,
  escalateTask,
  listAgentTasks,
  taskStats,
  sendAgentMessage,
  readInbox,
  messageHistory,
  enqueueAgentJob,
  listScheduledJobs,
  getAgentDefinition,
} from "@superior-ai/agents";

export async function GET() {
  return NextResponse.json({
    definitions: listAgentDefinitions().map((a) => ({
      id: a.id,
      role: a.role,
      displayName: a.displayName,
      tools: a.tools,
      permissions: a.permissions,
    })),
    instances: listAgentInstances(),
    tasks: listAgentTasks(),
    taskStats: taskStats(),
    scheduled: listScheduledJobs(),
    recentMessages: messageHistory(20),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action ?? "");

    if (action === "create") {
      const inst = createAgentInstance(String(body.definitionId ?? body.id), {
        goals: body.goals,
      });
      if (!inst) return NextResponse.json({ error: "unknown definition" }, { status: 404 });
      return NextResponse.json(inst, { status: 201 });
    }

    if (action === "run") {
      const result = await runAgentTask(
        String(body.definitionId ?? "researcher"),
        String(body.objective ?? body.message ?? "")
      );
      return NextResponse.json(result);
    }

    if (action === "assign") {
      const task = createAgentTask({
        title: String(body.title ?? body.objective ?? "task").slice(0, 80),
        objective: String(body.objective ?? ""),
        requesterId: body.requesterId ?? "executive",
      });
      await assignTask(task.id, String(body.assigneeId));
      return NextResponse.json(task);
    }

    if (action === "complete") {
      return NextResponse.json(await completeTask(String(body.taskId), String(body.result ?? "done")));
    }

    if (action === "fail") {
      return NextResponse.json(await failTask(String(body.taskId), String(body.error ?? "failed")));
    }

    if (action === "retry") {
      return NextResponse.json(await retryTask(String(body.taskId)));
    }

    if (action === "escalate") {
      return NextResponse.json(
        await escalateTask(String(body.taskId), String(body.toAgentId ?? "executive"), String(body.reason ?? "escalation"))
      );
    }

    if (action === "message") {
      const msg = await sendAgentMessage({
        from: String(body.from),
        to: String(body.to),
        type: body.type ?? "inform",
        payload: body.payload ?? {},
      });
      return NextResponse.json(msg);
    }

    if (action === "inbox") {
      return NextResponse.json({ messages: readInbox(String(body.agentId), Boolean(body.clear)) });
    }

    if (action === "use_tool") {
      const inst = createAgentInstance(String(body.definitionId));
      if (!inst) return NextResponse.json({ error: "unknown agent" }, { status: 404 });
      const result = await agentUseTool(inst.id, String(body.tool), body.input ?? {});
      return NextResponse.json({ instanceId: inst.id, result });
    }

    if (action === "use_memory") {
      const inst = createAgentInstance(String(body.definitionId ?? "researcher"));
      if (!inst) return NextResponse.json({ error: "unknown agent" }, { status: 404 });
      const mem = await agentUseMemory(inst.id, String(body.query ?? ""));
      return NextResponse.json(mem);
    }

    if (action === "call_agent") {
      const from = createAgentInstance(String(body.fromDefinitionId ?? "executive"));
      if (!from) return NextResponse.json({ error: "from agent missing" }, { status: 404 });
      const result = await agentCallAgent(from.id, String(body.toDefinitionId), body.payload ?? {});
      return NextResponse.json(result);
    }

    if (action === "schedule") {
      const job = enqueueAgentJob({
        agentDefinitionId: String(body.definitionId ?? "researcher"),
        objective: String(body.objective ?? ""),
        priority: body.priority,
      });
      return NextResponse.json(job, { status: 201 });
    }

    if (action === "definition") {
      const def = getAgentDefinition(String(body.id));
      if (!def) return NextResponse.json({ error: "not found" }, { status: 404 });
      return NextResponse.json(def);
    }

    return NextResponse.json(
      {
        error:
          "action must be create | run | assign | complete | fail | retry | escalate | message | inbox | use_tool | use_memory | call_agent | schedule | definition",
      },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
