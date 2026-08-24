/**
 * Agent permission checks.
 */

export type AgentPermission =
  | "plan"
  | "delegate"
  | "approve"
  | "finalize"
  | "research"
  | "analyze"
  | "search"
  | "extract"
  | "cite"
  | "code"
  | "test"
  | "commit"
  | "design"
  | "review"
  | "audit"
  | "db"
  | "tool:web_search"
  | "tool:browser"
  | "tool:code_exec"
  | "tool:memory"
  | string;

export function hasAgentPermission(
  granted: string[],
  required: string | string[]
): boolean {
  const need = Array.isArray(required) ? required : [required];
  return need.every((p) => granted.includes(p) || granted.includes("*"));
}

export function assertPermission(granted: string[], required: string): void {
  if (!hasAgentPermission(granted, required)) {
    throw new Error(`Forbidden: agent lacks permission "${required}"`);
  }
}
