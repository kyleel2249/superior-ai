/**
 * Universal slash commands — map user intent to departments, task types, modes.
 * Commands do not invent execution; they route into the orchestrator / chat path.
 */

import type { IntelligenceLevel, TaskType } from "@superior-ai/core";

export const UNIVERSAL_COMMANDS = [
  "build",
  "research",
  "deep-research",
  "code",
  "review",
  "debug",
  "fix",
  "analyze",
  "strategy",
  "finance",
  "marketing",
  "sales",
  "design",
  "image",
  "video",
  "ugc",
  "seo",
  "competitor",
  "customer",
  "support",
  "deploy",
  "automate",
  "create-agent",
  "create-team",
  "create-product",
  "create-brand",
  "supreme",
  "autonomous",
] as const;

export type UniversalCommand = (typeof UNIVERSAL_COMMANDS)[number];

export interface ParsedCommand {
  command: UniversalCommand | null;
  rest: string;
  taskType: TaskType;
  intelligenceLevel?: IntelligenceLevel;
  departmentHint?: string;
  mode?: "supreme" | "autonomous" | "standard";
}

const COMMAND_MAP: Record<
  UniversalCommand,
  { taskType: TaskType; departmentHint?: string; intelligenceLevel?: IntelligenceLevel; mode?: ParsedCommand["mode"] }
> = {
  build: { taskType: "coding", departmentHint: "technology" },
  research: { taskType: "research", departmentHint: "strategy" },
  "deep-research": { taskType: "research", departmentHint: "strategy", intelligenceLevel: "MAXIMUM" },
  code: { taskType: "coding", departmentHint: "technology" },
  review: { taskType: "coding", departmentHint: "technology" },
  debug: { taskType: "coding", departmentHint: "technology" },
  fix: { taskType: "coding", departmentHint: "technology" },
  analyze: { taskType: "analysis", departmentHint: "strategy" },
  strategy: { taskType: "strategy", departmentHint: "strategy" },
  finance: { taskType: "financial", departmentHint: "finance" },
  marketing: { taskType: "creative", departmentHint: "marketing" },
  sales: { taskType: "analysis", departmentHint: "sales" },
  design: { taskType: "creative", departmentHint: "creative" },
  image: { taskType: "creative", departmentHint: "creative" },
  video: { taskType: "creative", departmentHint: "creative" },
  ugc: { taskType: "creative", departmentHint: "creative" },
  seo: { taskType: "research", departmentHint: "marketing" },
  competitor: { taskType: "research", departmentHint: "strategy" },
  customer: { taskType: "analysis", departmentHint: "cx" },
  support: { taskType: "chat", departmentHint: "support" },
  deploy: { taskType: "deployment", departmentHint: "technology" },
  automate: { taskType: "automation", departmentHint: "operations" },
  "create-agent": { taskType: "automation", departmentHint: "operations" },
  "create-team": { taskType: "automation", departmentHint: "operations" },
  "create-product": { taskType: "strategy", departmentHint: "product" },
  "create-brand": { taskType: "creative", departmentHint: "creative" },
  supreme: { taskType: "analysis", intelligenceLevel: "SUPREME", mode: "supreme" },
  autonomous: { taskType: "automation", intelligenceLevel: "AUTONOMOUS", mode: "autonomous" },
};

/** Parse leading /command from message. */
export function parseUniversalCommand(message: string): ParsedCommand {
  const trimmed = message.trim();
  const m = trimmed.match(/^\/([a-z0-9-]+)(?:\s+([\s\S]*))?$/i);
  if (!m) {
    return { command: null, rest: trimmed, taskType: "chat", mode: "standard" };
  }
  const cmd = m[1].toLowerCase() as UniversalCommand;
  const rest = (m[2] ?? "").trim();
  if (!UNIVERSAL_COMMANDS.includes(cmd)) {
    return { command: null, rest: trimmed, taskType: "chat", mode: "standard" };
  }
  const meta = COMMAND_MAP[cmd];
  return {
    command: cmd,
    rest: rest || trimmed,
    taskType: meta.taskType,
    intelligenceLevel: meta.intelligenceLevel,
    departmentHint: meta.departmentHint,
    mode: meta.mode ?? "standard",
  };
}

export function describeCommand(cmd: UniversalCommand): string {
  const meta = COMMAND_MAP[cmd];
  return `/${cmd} → task=${meta.taskType}` +
    (meta.departmentHint ? ` · dept=${meta.departmentHint}` : "") +
    (meta.mode && meta.mode !== "standard" ? ` · mode=${meta.mode}` : "");
}

export function listCommandsHelp(): string {
  return [
    "**Universal commands**",
    ...UNIVERSAL_COMMANDS.map((c) => `- ${describeCommand(c)}`),
    "",
    "Example: `/research competitor pricing for SMB CRM in Ghana`",
    "Example: `/supreme Should we expand into West Africa this quarter?`",
    "Example: `/autonomous Launch a lead-gen campaign for our CRM`",
  ].join("\n");
}
