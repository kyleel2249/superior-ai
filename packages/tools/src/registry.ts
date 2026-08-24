import type { ToolDefinition } from "./types";

const tools = new Map<string, ToolDefinition>();

export function registerTool(tool: ToolDefinition): void {
  tools.set(tool.name, tool);
}

export function getTool(name: string): ToolDefinition | undefined {
  return tools.get(name);
}

export function listTools(): Array<Pick<ToolDefinition, "name" | "description" | "permissions" | "sensitive">> {
  return Array.from(tools.values()).map(({ name, description, permissions, sensitive }) => ({ name, description, permissions, sensitive }));
}

export async function runTool(name: string, input: Record<string, unknown>) {
  const tool = tools.get(name);
  if (!tool) return { success: false as const, error: `Unknown tool: ${name}` };
  return tool.execute(input);
}
