/**
 * Execution sandbox policy & gVisor migration notes.
 * Current runtime: process-level sandbox (see @superior-ai/tools code-exec).
 * Target: gVisor / Firecracker for untrusted workloads.
 */

export type SandboxTier = "dry_run" | "process" | "gvisor" | "firecracker";

export interface SandboxPolicy {
  tier: SandboxTier;
  allowNetwork: boolean;
  allowFilesystemWrite: boolean;
  maxTimeoutMs: number;
  maxMemoryMb: number;
  requireApprovalForShell: boolean;
  blockedModules: string[];
  notes: string[];
}

export function currentSandboxPolicy(): SandboxPolicy {
  const allowExec = process.env.ALLOW_CODE_EXEC === "1";
  const preferGvisor = process.env.SANDBOX_TIER === "gvisor";

  return {
    tier: !allowExec ? "dry_run" : preferGvisor ? "gvisor" : "process",
    allowNetwork: false,
    allowFilesystemWrite: false,
    maxTimeoutMs: Number(process.env.CODE_EXEC_TIMEOUT_MS ?? 15_000),
    maxMemoryMb: Number(process.env.CODE_EXEC_MEMORY_MB ?? 128),
    requireApprovalForShell: true,
    blockedModules: [
      "child_process",
      "fs (write/unlink)",
      "net",
      "http",
      "https",
      "process.env secrets",
    ],
    notes: [
      "Default is dry-run unless ALLOW_CODE_EXEC=1.",
      "Process sandbox strips cloud credentials from env.",
      "gVisor/Firecracker not assumed present — see gVisor worker notes.",
      "Shell language requires explicit human approval path.",
    ],
  };
}

export function gvisorWorkerNotes(): {
  status: "DOCUMENTED" | "AVAILABLE";
  summary: string;
  steps: string[];
  limitations: string[];
} {
  return {
    status: "DOCUMENTED",
    summary:
      "SUPERIOR AI documents gVisor as the preferred next isolation tier for untrusted code_exec workers. Not required for local-first dry-run mode.",
    steps: [
      "Run worker nodes with runsc (gVisor) as the container runtime.",
      "Map code-exec jobs to a dedicated non-root user and empty workspace volume.",
      "Keep network namespace off; inject only allowlisted package mirrors if needed.",
      "Set memory/CPU cgroup limits matching SandboxPolicy.",
      "Stream stdout/stderr capped; never mount host secrets.",
      "Health-check runsc before routing jobs; fall back to dry-run if unavailable.",
    ],
    limitations: [
      "gVisor is not installed by default in this monorepo.",
      "Windows hosts cannot run gVisor natively — use Linux workers or WSL2 remote.",
      "Some syscalls are restricted; certain native modules may fail.",
    ],
  };
}

export function assertSafeCodeSnippet(code: string): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const patterns: Array<{ re: RegExp; reason: string }> = [
    { re: /child_process/i, reason: "child_process blocked" },
    { re: /process\.env/i, reason: "process.env access blocked" },
    { re: /\bfs\.(write|unlink|rm|rmdir)/i, reason: "filesystem mutation blocked" },
    { re: /require\s*\(\s*['"]net['"]\s*\)/i, reason: "net module blocked" },
    { re: /fetch\s*\(\s*['"]https?:/i, reason: "outbound fetch discouraged in sandbox" },
  ];
  for (const p of patterns) {
    if (p.re.test(code)) reasons.push(p.reason);
  }
  return { ok: reasons.length === 0, reasons };
}
