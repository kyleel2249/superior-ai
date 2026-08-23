/**
 * Repository sandbox tools
 * Inspect local paths under an allowlisted workspace only — no arbitrary host FS.
 * Remote clone requires explicit REPO_SANDBOX_ROOT and network policy.
 */

import { readdir, readFile, stat } from "fs/promises";
import { join, normalize, relative, resolve, sep } from "path";

export interface RepoInspectResult {
  success: boolean;
  root?: string;
  files?: Array<{ path: string; size: number; type: "file" | "dir" }>;
  error?: string;
  note?: string;
}

function sandboxRoot(): string {
  return process.env.REPO_SANDBOX_ROOT || join(process.cwd(), ".repo-sandbox");
}

/** Prevent path escape from sandbox */
function safeResolve(root: string, target: string): string | null {
  const resolved = resolve(root, target);
  const rel = relative(root, resolved);
  if (rel.startsWith("..") || resolve(root, rel) !== resolved) {
    return null;
  }
  return resolved;
}

export async function repoListFiles(input: {
  subpath?: string;
  maxEntries?: number;
}): Promise<RepoInspectResult> {
  const root = sandboxRoot();
  const sub = input.subpath || ".";
  const dir = safeResolve(root, sub);
  if (!dir) {
    return { success: false, error: "Path escapes sandbox" };
  }

  try {
    await stat(dir);
  } catch {
    return {
      success: false,
      error: `Sandbox path not found: ${sub}`,
      note: `Create or clone into REPO_SANDBOX_ROOT (${root}). Remote clone is opt-in via repoClone.`,
    };
  }

  const max = input.maxEntries ?? 200;
  const files: Array<{ path: string; size: number; type: "file" | "dir" }> = [];

  async function walk(current: string, prefix: string): Promise<void> {
    if (files.length >= max) return;
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      if (files.length >= max) break;
      if (ent.name === ".git" || ent.name === "node_modules") continue;
      const rel = prefix ? `${prefix}/${ent.name}` : ent.name;
      const full = join(current, ent.name);
      if (ent.isDirectory()) {
        files.push({ path: rel + "/", size: 0, type: "dir" });
        await walk(full, rel);
      } else if (ent.isFile()) {
        const st = await stat(full).catch(() => null);
        files.push({ path: rel, size: st?.size ?? 0, type: "file" });
      }
    }
  }

  await walk(dir, sub === "." ? "" : sub);
  return {
    success: true,
    root,
    files,
    note: files.length >= max ? `Truncated at ${max} entries` : undefined,
  };
}

export async function repoReadFile(input: {
  path: string;
  maxBytes?: number;
}): Promise<{ success: boolean; content?: string; error?: string; size?: number }> {
  const root = sandboxRoot();
  const full = safeResolve(root, input.path);
  if (!full) return { success: false, error: "Path escapes sandbox" };

  const maxBytes = input.maxBytes ?? 256_000;
  try {
    const st = await stat(full);
    if (!st.isFile()) return { success: false, error: "Not a file" };
    if (st.size > maxBytes) {
      return {
        success: false,
        error: `File too large (${st.size} bytes). maxBytes=${maxBytes}`,
        size: st.size,
      };
    }
    const content = await readFile(full, "utf8");
    return { success: true, content, size: st.size };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Clone via git CLI only when ALLOW_REPO_CLONE=1 and URL is https.
 * Never executes arbitrary remote content beyond git clone into sandbox.
 */
export async function repoClone(input: {
  url: string;
  name?: string;
}): Promise<RepoInspectResult> {
  if (process.env.ALLOW_REPO_CLONE !== "1") {
    return {
      success: false,
      error: "Clone disabled. Set ALLOW_REPO_CLONE=1 to enable git clone into sandbox.",
    };
  }

  const url = input.url.trim();
  if (!url.startsWith("https://") && !url.startsWith("git@")) {
    return { success: false, error: "Only https:// or git@ URLs allowed" };
  }
  // Basic SSRF guard — block localhost/metadata
  if (/localhost|127\.0\.0\.1|169\.254\.|0\.0\.0\.0|\[::1\]/i.test(url)) {
    return { success: false, error: "Local/metadata URLs blocked" };
  }

  const root = sandboxRoot();
  const name =
    input.name ||
    url
      .replace(/\.git$/, "")
      .split("/")
      .filter(Boolean)
      .pop() ||
    `repo_${Date.now()}`;
  const dest = safeResolve(root, name);
  if (!dest) return { success: false, error: "Invalid destination" };

  try {
    const { mkdir } = await import("fs/promises");
    await mkdir(root, { recursive: true });
    const { execFile } = await import("child_process");
    const { promisify } = await import("util");
    const execFileAsync = promisify(execFile);
    await execFileAsync("git", ["clone", "--depth", "1", url, dest], {
      timeout: 120_000,
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    });
    return repoListFiles({ subpath: name });
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      note: "Ensure git is installed and URL is reachable.",
    };
  }
}

export function registerRepoTools(
  register: (name: string, fn: (args: Record<string, unknown>) => Promise<unknown>) => void
): void {
  register("repo_list", async (args) =>
    repoListFiles({ subpath: args.subpath as string | undefined, maxEntries: args.maxEntries as number | undefined })
  );
  register("repo_read", async (args) =>
    repoReadFile({ path: String(args.path ?? ""), maxBytes: args.maxBytes as number | undefined })
  );
  register("repo_clone", async (args) =>
    repoClone({ url: String(args.url ?? ""), name: args.name as string | undefined })
  );
}
