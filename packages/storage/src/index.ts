/**
 * Local filesystem object storage abstraction.
 * S3-compatible remote can replace this without changing callers.
 */

import { mkdir, writeFile, readFile, unlink, readdir, stat } from "fs/promises";
import { join, dirname, normalize } from "path";
import { loadConfig, logger } from "@superior-ai/core";

function rootDir(): string {
  return loadConfig().storageRoot || ".data/objects";
}

function safeKey(key: string): string {
  const cleaned = key.replace(/^\/+/, "").replace(/\.\./g, "");
  if (!cleaned || cleaned.includes("\0")) throw new Error("Invalid storage key");
  return cleaned;
}

export async function putObject(
  key: string,
  data: Buffer | string,
  meta?: { contentType?: string }
): Promise<{ key: string; bytes: number; path: string }> {
  const k = safeKey(key);
  const full = join(rootDir(), k);
  await mkdir(dirname(full), { recursive: true });
  const buf = typeof data === "string" ? Buffer.from(data, "utf8") : data;
  await writeFile(full, buf);
  if (meta?.contentType) {
    await writeFile(full + ".meta.json", JSON.stringify(meta), "utf8");
  }
  logger.debug("storage.put", { key: k, bytes: buf.length });
  return { key: k, bytes: buf.length, path: full };
}

export async function getObject(key: string): Promise<Buffer | null> {
  const k = safeKey(key);
  const full = join(rootDir(), k);
  try {
    return await readFile(full);
  } catch {
    return null;
  }
}

export async function deleteObject(key: string): Promise<boolean> {
  const k = safeKey(key);
  const full = join(rootDir(), k);
  try {
    await unlink(full);
    await unlink(full + ".meta.json").catch(() => undefined);
    return true;
  } catch {
    return false;
  }
}

export async function listObjects(prefix = ""): Promise<string[]> {
  const base = join(rootDir(), safeKey(prefix || "."));
  try {
    const st = await stat(base);
    if (!st.isDirectory()) return [];
  } catch {
    return [];
  }
  const out: string[] = [];
  async function walk(dir: string, rel: string) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.name.endsWith(".meta.json")) continue;
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) await walk(join(dir, e.name), r);
      else out.push(r);
    }
  }
  await walk(base, prefix.replace(/^\/+/, ""));
  return out;
}

export function storageStatus(): { root: string; driver: "local_fs" } {
  return { root: rootDir(), driver: "local_fs" };
}
