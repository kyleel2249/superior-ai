/**
 * Agent runtime — create instances from definitions, run tool+memory steps.
 */

import type { AgentDefinition } from "@superior-ai/core";
import { COUNCIL_AGENTS } from "../council";
import { runTool, type ToolContext } from "@superior-ai/tools";
import { remember, retrieveRelevant, formatMemoryForPrompt } from "@superior-ai/memory";
import { hasAgentPermission } from "./permissions";
import { sendAgentMessage, readInbox } from "./message-bus";
import {
  createAgentTask,
  assignTask,
  startTask,
  completeTask,
  failTask,
  getAgentTask,
  type AgentTask,
} from "./task-manager";

export type AgentLifecycle = "created" | "idle" | "busy" | "waiting" | "error" | "stopped";

export interface AgentInstance {
  id: string;
  definition: AgentDefinition;
  lifecycle: AgentLifecycle;
  goals: string[];
  kpis: Record<string, number>;
  state: Record<string, unknown>;
  createdAt: string;
}

const instances = new Map<string, AgentInstance>();

export function listAgentDefinitions(): AgentDefinition[] {
  return [...COUNCIL_AGENTS];
}

export function getAgentDefinition(id: string): AgentDefinition | undefined {
  return COUNCIL_AGENTS.find((a) => a.id === id);
}

export function createAgentInstance(
  definitionId: string,
  opts?: { goals?: string[]; state?: Record<string, unknown> }
): AgentInstance | null {
  const def = getAgentDefinition(definitionId);
  if (!def) return null;
  const inst: AgentInstance = {
    id: `inst_${def.id}_${Date.now().toString(36)}`,
    definition: def,
    lifecycle: "created",
    goals: opts?.goals ?? [],
    kpis: { tasks_completed: 0, tasks_failed: 0 },
    state: opts?.state ?? {},
    createdAt: new Date().toISOString(),
  };
  instances.set(inst.id, inst);
  inst.lifecycle = "idle";
  return inst;
}

export function getAgentInstance(id: string): AgentInstance | null {
  return instances.get(id) ?? null;
}

export function listAgentInstances(): AgentInstance[] {
  return [...instances.values()];
}

export async function agentUseMemory(
  instanceId: string,
  query: string
): Promise<{ promptBlock: string; count: number }> {
  const inst = instances.get(instanceId);
  if (!inst) throw new Error("Agent instance not found");
  if (!hasAgentPermission(inst.definition.permissions, "research") &&
      !inst.definition.tools.includes("memory")) {
    // allow read if tool listed
  }
  const records = retrieveRelevant({ query, limit: 6 });
  return { promptBlock: formatMemoryForPrompt(records), count: records.length };
}

export async function agentRemember(
  instanceId: string,
  content: string,
  type: "agent" | "decision" | "research" = "agent"
): Promise<void> {
  const inst = instances.get(instanceId);
  if (!inst) throw new Error("Agent instance not found");
  remember({
    type,
    content,
    importance: 70,
    tags: [inst.definition.role, inst.id],
    metadata: { agentId: inst.definition.id },
  });
}

export async function agentUseTool(
  instanceId: string,
  toolName: string,
  input: Record<string, unknown>
): Promise<unknown> {
  const inst = instances.get(instanceId);
  if (!inst) throw new Error("Agent instance not found");
  if (!inst.definition.tools.includes(toolName) && !inst.definition.tools.includes("*")) {
    // map aliases
    const aliases: Record<string, string> = {
      web_search: "web_search",
      browser: "url_fetch",
      memory: "memory",
    };
    const mapped = aliases[toolName] ?? toolName;
    if (!inst.definition.tools.some((t) => t === toolName || t.includes(toolName.split("_")[0]!))) {
      throw new Error(`Agent ${inst.definition.id} cannot use tool ${toolName}`);
    }
    void mapped;
  }

  const ctx: ToolContext = {
    approvalPolicy: "sensitive_only",
    grantedPermissions: ["web_search", "browser", "code_runner", "file_system", "read_files"],
    projectId: String(inst.state.projectId ?? ""),
  };

  const tool =
    toolName === "browser"
      ? "url_fetch"
      : toolName === "web_search"
        ? "web_search"
        : toolName;

  const result = await runTool(tool, input, ctx);
  return result;
}

export async function agentCallAgent(
  fromInstanceId: string,
  toDefinitionId: string,
  payload: Record<string, unknown>
): Promise<{ messageId: string }> {
  const from = instances.get(fromInstanceId);
  if (!from) throw new Error("From agent not found");
  const msg = await sendAgentMessage({
    from: from.definition.id,
    to: toDefinitionId,
    type: "ask",
    payload,
  });
  return { messageId: msg.id };
}

export async function runAgentTask(
  definitionId: string,
  objective: string
): Promise<{ instance: AgentInstance; task: AgentTask; output: string }> {
  const inst = createAgentInstance(definitionId, { goals: [objective] });
  if (!inst) throw new Error(`Unknown agent definition: ${definitionId}`);

  inst.lifecycle = "busy";
  const task = createAgentTask({
    title: objective.slice(0, 80),
    objective,
    requesterId: "executive",
  });
  await assignTask(task.id, inst.definition.id);
  startTask(task.id);

  try {
    // memory
    const mem = await agentUseMemory(inst.id, objective);
    // optional search if researcher
    let toolNote = "";
    if (inst.definition.tools.includes("web_search") || inst.definition.role === "researcher") {
      try {
        const search = await agentUseTool(inst.id, "web_search", {
          query: objective.slice(0, 200),
        });
        toolNote = `\nTool web_search: ${JSON.stringify(search).slice(0, 500)}`;
      } catch (err) {
        toolNote = `\nTool skipped: ${err instanceof Error ? err.message : String(err)}`;
      }
    }

    const output = [
      `Agent: ${inst.definition.displayName}`,
      `Role: ${inst.definition.role}`,
      `Objective: ${objective}`,
      mem.count ? `Memory context items: ${mem.count}` : "Memory: none matched",
      toolNote,
      `Instructions applied: ${inst.definition.systemPrompt.slice(0, 200)}…`,
    ].join("\n");

    await agentRemember(inst.id, `Completed: ${objective.slice(0, 200)}`, "agent");
    await completeTask(task.id, output);
    inst.kpis.tasks_completed = (inst.kpis.tasks_completed ?? 0) + 1;
    inst.lifecycle = "idle";
    const done = getAgentTask(task.id)!;
    return { instance: inst, task: done, output };
  } catch (err) {
    await failTask(task.id, err instanceof Error ? err.message : String(err));
    inst.kpis.tasks_failed = (inst.kpis.tasks_failed ?? 0) + 1;
    inst.lifecycle = "error";
    throw err;
  }
}
