/**
 * Universal Tool Framework
 * Permission-gated, logged, sandboxed where applicable.
 */

export type ToolPermission =
  | "web_search"
  | "browser"
  | "code_runner"
  | "file_system"
  | "git"
  | "email_send"
  | "crm_write"
  | "social_publish"
  | "deploy"
  | "payment"
  | "delete_data"
  | "read_files";

export interface ToolContext {
  userId?: string;
  organizationId?: string;
  projectId?: string;
  taskId?: string;
  approvalPolicy: "always_ask" | "sensitive_only" | "fully_autonomous";
  grantedPermissions: ToolPermission[];
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  requiresApproval?: boolean;
  approvalReason?: string;
  provenance?: "Observed Data" | "Third-Party Estimate" | "Model Inference";
  latencyMs?: number;
}

export interface ToolDefinition {
  name: string;
  description: string;
  permissions: ToolPermission[];
  sensitive: boolean;
  execute: (input: Record<string, unknown>, ctx: ToolContext) => Promise<ToolResult>;
}
