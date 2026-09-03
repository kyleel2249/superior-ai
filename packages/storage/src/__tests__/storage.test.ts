import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

let tmpDir: string;

async function freshStorage() {
  const core = await import("@superior-ai/core");
  core.resetConfigCache();
  return import("../index");
}

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "superior-ai-storage-test-"));
  process.env.OBJECT_STORAGE_ROOT = tmpDir;
});

afterEach(() => {
  delete process.env.OBJECT_STORAGE_ROOT;
  rmSync(tmpDir, { recursive: true, force: true });
});

describe("putObject / getObject", () => {
  it("round-trips a string payload", async () => {
    const { putObject, getObject } = await freshStorage();
    await putObject("notes/hello.txt", "hello world");
    const buf = await getObject("notes/hello.txt");
    expect(buf?.toString("utf8")).toBe("hello world");
  });

  it("round-trips a Buffer payload byte-for-byte", async () => {
    const { putObject, getObject } = await freshStorage();
    const original = Buffer.from([0, 1, 2, 255, 254, 253]);
    await putObject("binary/data.bin", original);
    const buf = await getObject("binary/data.bin");
    expect(buf?.equals(original)).toBe(true);
  });

  it("returns null for a key that was never written, rather than throwing", async () => {
    const { getObject } = await freshStorage();
    expect(await getObject("never/written.txt")).toBeNull();
  });

  it("creates nested directories automatically", async () => {
    const { putObject, getObject } = await freshStorage();
    await putObject("a/b/c/d/deep.txt", "deep value");
    expect((await getObject("a/b/c/d/deep.txt"))?.toString()).toBe("deep value");
  });

  it("overwriting a key replaces its content", async () => {
    const { putObject, getObject } = await freshStorage();
    await putObject("k.txt", "first");
    await putObject("k.txt", "second");
    expect((await getObject("k.txt"))?.toString()).toBe("second");
  });
});

describe("path traversal defense", () => {
  it("strips '..' segments rather than escaping the storage root", async () => {
    const { putObject, getObject } = await freshStorage();
    // Attempted escape — safeKey strips ".." so this must land inside the root.
    await putObject("../../etc/passwd", "should not escape");
    const direct = await getObject("etc/passwd");
    expect(direct?.toString()).toBe("should not escape");
  });

  it("strips leading slashes so an absolute-looking key stays relative", async () => {
    const { putObject, getObject } = await freshStorage();
    await putObject("/absolute/looking/key.txt", "still relative");
    expect((await getObject("absolute/looking/key.txt"))?.toString()).toBe("still relative");
  });

  it("rejects a key containing a null byte", async () => {
    const { putObject } = await freshStorage();
    await expect(putObject("bad\0key.txt", "x")).rejects.toThrow(/Invalid storage key/);
  });

  it("rejects an empty key after sanitization", async () => {
    const { putObject } = await freshStorage();
    await expect(putObject("///", "x")).rejects.toThrow(/Invalid storage key/);
  });
});

describe("deleteObject", () => {
  it("removes a stored object and returns true", async () => {
    const { putObject, getObject, deleteObject } = await freshStorage();
    await putObject("to-delete.txt", "bye");
    expect(await deleteObject("to-delete.txt")).toBe(true);
    expect(await getObject("to-delete.txt")).toBeNull();
  });

  it("returns false for deleting a key that doesn't exist, rather than throwing", async () => {
    const { deleteObject } = await freshStorage();
    expect(await deleteObject("never-existed.txt")).toBe(false);
  });
});

describe("listObjects", () => {
  it("lists all keys under a prefix, recursively, excluding .meta.json sidecars", async () => {
    const { putObject, listObjects } = await freshStorage();
    await putObject("reports/2026/jan.txt", "a", { contentType: "text/plain" });
    await putObject("reports/2026/feb.txt", "b");
    await putObject("reports/other.txt", "c");
    await putObject("unrelated/file.txt", "d");

    const keys = await listObjects("reports");
    expect(keys.sort()).toEqual(
      ["reports/2026/feb.txt", "reports/2026/jan.txt", "reports/other.txt"].sort()
    );
    expect(keys.some((k) => k.endsWith(".meta.json"))).toBe(false);
  });

  it("returns an empty array for a prefix that doesn't exist", async () => {
    const { listObjects } = await freshStorage();
    expect(await listObjects("does/not/exist")).toEqual([]);
  });
});

describe("storageStatus", () => {
  it("reports the local_fs driver and the configured root", async () => {
    const { storageStatus } = await freshStorage();
    const status = storageStatus();
    expect(status.driver).toBe("local_fs");
    expect(status.root).toBe(tmpDir);
  });
});
