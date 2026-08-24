export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  /** Where the data came from — never claim "Observed Data" for anything not actually fetched. */
  provenance?: "Observed Data" | "Model Inference";
}

export interface ToolDefinition {
  name: string;
  description: string;
  permissions: string[];
  sensitive: boolean;
  execute(input: Record<string, unknown>): Promise<ToolResult>;
}
