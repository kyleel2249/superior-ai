import type { ToolDefinition, ToolContext, ToolResult, ToolPermission } from "./types";

const tools = new Map<string, ToolDefinition>();

export function registerTool(tool: ToolDefinition): void {
  tools.set(tool.name, tool);
}

export function getTool(name: string): ToolDefinition | undefined {
  return tools.get(name);
}

export function listTools(): ToolDefinition[] {
  return Array.from(tools.values());
}

export async function runTool(
  name: string,
  input: Record<string, unknown>,
  ctx: ToolContext
): Promise<ToolResult> {
  const tool = tools.get(name);
  if (!tool) {
    return { success: false, error: `Unknown tool: ${name}` };
  }

  for (const perm of tool.permissions) {
    if (!ctx.grantedPermissions.includes(perm)) {
      return {
        success: false,
        error: `Missing permission: ${perm}`,
        requiresApproval: true,
        approvalReason: `Tool "${name}" requires permission "${perm}"`,
      };
    }
  }

  if (tool.sensitive && ctx.approvalPolicy === "always_ask") {
    return {
      success: false,
      requiresApproval: true,
      approvalReason: `Sensitive tool "${name}" requires explicit approval under Always Ask policy`,
    };
  }

  if (
    tool.sensitive &&
    ctx.approvalPolicy === "sensitive_only" &&
    !ctx.grantedPermissions.includes(tool.permissions[0] as ToolPermission)
  ) {
    return {
      success: false,
      requiresApproval: true,
      approvalReason: `Sensitive action gated: ${name}`,
    };
  }

  const start = Date.now();
  try {
    const result = await tool.execute(input, ctx);
    return { ...result, latencyMs: Date.now() - start };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      latencyMs: Date.now() - start,
    };
  }
}
