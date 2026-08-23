/**
 * Sandboxed code execution foundation
 * - Default: dry-run / language validation only
 * - When ALLOW_CODE_EXEC=1: run under timeout, no network, cwd=sandbox, resource limits
 * Not a full gVisor/Firecracker isolate — document as "process sandbox" until container runtime is wired.
 */

import { mkdir, writeFile, rm } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";

export type ExecLanguage = "javascript" | "typescript" | "python" | "shell";

export interface CodeExecRequest {
  language: ExecLanguage;
  code: string;
  timeoutMs?: number;
  /** If false (default), only validates and returns plan — does not execute */
  execute?: boolean;
}

export interface CodeExecResult {
  success: boolean;
  executed: boolean;
  language: ExecLanguage;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  durationMs?: number;
  error?: string;
  note?: string;
}

const BLOCKED_PATTERNS = [
  /child_process/i,
  /process\.env/i,
  /fs\.write/i,
  /fs\.unlink/i,
  /require\s*\(\s*['"]net['"]/i,
  /require\s*\(\s*['"]http['"]/i,
  /fetch\s*\(/i,
  /subprocess/i,
  /os\.system/i,
  /socket\./i,
  /eval\s*\(/i,
  /Function\s*\(/i,
  /rm\s+-rf\s+\//i,
  /curl\s+/i,
  /wget\s+/i,
];

function sandboxDir(): string {
  return process.env.CODE_SANDBOX_ROOT || join(process.cwd(), ".code-sandbox");
}

function validateCode(language: ExecLanguage, code: string): string | null {
  if (!code || code.length > 50_000) return "Code empty or exceeds 50KB limit";
  if (language === "shell") {
    return "Shell execution is disabled in default policy. Use javascript or python.";
  }
  for (const re of BLOCKED_PATTERNS) {
    if (re.test(code)) {
      return `Blocked pattern detected: ${re}. Code exec is restricted.`;
    }
  }
  return null;
}

export async function executeCode(req: CodeExecRequest): Promise<CodeExecResult> {
  const language = req.language;
  const validationError = validateCode(language, req.code);
  if (validationError) {
    return {
      success: false,
      executed: false,
      language,
      error: validationError,
    };
  }

  const shouldRun = req.execute === true && process.env.ALLOW_CODE_EXEC === "1";
  if (!shouldRun) {
    return {
      success: true,
      executed: false,
      language,
      note:
        "Validation passed. Set execute:true and ALLOW_CODE_EXEC=1 to run in process sandbox. For production isolation use gVisor/Firecracker sidecar.",
    };
  }

  const id = randomBytes(8).toString("hex");
  const dir = join(sandboxDir(), id);
  const timeoutMs = Math.min(req.timeoutMs ?? 5000, 15_000);
  const started = Date.now();

  try {
    await mkdir(dir, { recursive: true });
    const { execFile } = await import("child_process");
    const { promisify } = await import("util");
    const execFileAsync = promisify(execFile);

    let cmd: string;
    let args: string[];
    let filename: string;

    if (language === "javascript" || language === "typescript") {
      filename = "main.mjs";
      await writeFile(join(dir, filename), req.code, "utf8");
      cmd = "node";
      args = [filename];
    } else if (language === "python") {
      filename = "main.py";
      await writeFile(join(dir, filename), req.code, "utf8");
      cmd =
        process.env.PYTHON_PATH ||
        process.env.PYTHON ||
        (process.platform === "win32" ? "python" : "python3");
      args = [filename];
    } else {
      return { success: false, executed: false, language, error: "Unsupported language" };
    }

    try {
      const { stdout, stderr } = await execFileAsync(cmd, args, {
        cwd: dir,
        timeout: timeoutMs,
        maxBuffer: 512_000,
        env: {
          PATH: process.env.PATH,
          HOME: dir,
          NODE_OPTIONS: "--max-old-space-size=128",
          // No AWS/GCP/API keys forwarded
        },
      });
      return {
        success: true,
        executed: true,
        language,
        stdout: String(stdout).slice(0, 20_000),
        stderr: String(stderr).slice(0, 5_000),
        exitCode: 0,
        durationMs: Date.now() - started,
        note: "Process sandbox only — not kernel-level isolation.",
      };
    } catch (err: unknown) {
      const e = err as { stdout?: string; stderr?: string; code?: number; message?: string };
      return {
        success: false,
        executed: true,
        language,
        stdout: e.stdout ? String(e.stdout).slice(0, 20_000) : undefined,
        stderr: e.stderr ? String(e.stderr).slice(0, 5_000) : e.message,
        exitCode: typeof e.code === "number" ? e.code : 1,
        durationMs: Date.now() - started,
        error: "Execution failed or timed out",
      };
    }
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}
