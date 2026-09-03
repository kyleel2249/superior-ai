import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

// storageRoot is read via @superior-ai/core's loadConfig(), which caches —
// so we point OBJECT_STORAGE_ROOT at a fresh temp dir and reset both the
// core config cache and this module's hydration state before every test to
// keep them fully isolated from each other and from any other test file.
let tmpDir: string;

async function freshModules() {
  const core = await import("@superior-ai/core");
  core.resetConfigCache();
  const creds = await import("../credentials");
  creds.__resetCredentialsHydrationForTests();
  return creds;
}

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "superior-ai-creds-test-"));
  process.env.OBJECT_STORAGE_ROOT = tmpDir;
});

afterEach(() => {
  delete process.env.OBJECT_STORAGE_ROOT;
  rmSync(tmpDir, { recursive: true, force: true });
  delete process.env.OPENAI_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
});

describe("setProviderKey / listCredentialStatus", () => {
  it("saving a key makes it immediately readable via getCredentials, with no other code changed", async () => {
    delete process.env.OPENAI_API_KEY;
    const { setProviderKey, getCredentials } = await freshModules();

    await setProviderKey("openai", "sk-test-1234567890");
    expect(getCredentials("openai").apiKey).toBe("sk-test-1234567890");
  });

  it("reports source:'runtime' and a masked fingerprint, never the raw key", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const { setProviderKey, listCredentialStatus } = await freshModules();

    const status = await setProviderKey("anthropic", "sk-ant-abcdefghij");
    expect(status.source).toBe("runtime");
    expect(status.configured).toBe(true);
    expect(status.keyFingerprint).not.toContain("abcdefghij");
    expect(status.keyFingerprint).toMatch(/…/);

    const all = listCredentialStatus();
    const anthropic = all.find((s) => s.provider === "anthropic");
    expect(anthropic?.source).toBe("runtime");
  });

  it("rejects keys that are obviously too short", async () => {
    const { setProviderKey } = await freshModules();
    await expect(setProviderKey("openai", "abc")).rejects.toThrow(/too short/);
  });

  it("rejects providers with no key slot (e.g. unknown/custom)", async () => {
    const { setProviderKey } = await freshModules();
    await expect(setProviderKey("custom" as never, "some-long-enough-key")).rejects.toThrow();
  });
});

describe("real deployment env always wins over a runtime-saved key", () => {
  it("a pre-existing env var is never overwritten by a runtime save", async () => {
    process.env.OPENAI_API_KEY = "real-infra-key-do-not-touch";
    const { setProviderKey, getCredentials, listCredentialStatus } = await freshModules();

    await setProviderKey("openai", "ui-submitted-key-should-not-win");
    expect(getCredentials("openai").apiKey).toBe("real-infra-key-do-not-touch");
    expect(listCredentialStatus().find((s) => s.provider === "openai")?.source).toBe("env");
  });
});

describe("persistence across a fresh hydration (simulating a restart)", () => {
  it("a saved key survives re-hydration from disk when no env var is set", async () => {
    delete process.env.OPENAI_API_KEY;
    const { setProviderKey } = await freshModules();
    await setProviderKey("openai", "sk-persisted-key-12345");

    // Simulate a restart: clear process.env for this provider and force a
    // fresh module-level hydration state, then hydrate from the same
    // storage root again.
    delete process.env.OPENAI_API_KEY;
    const { ensureCredentialsHydrated, getCredentials, __resetCredentialsHydrationForTests } =
      await import("../credentials");
    __resetCredentialsHydrationForTests();
    await ensureCredentialsHydrated();

    expect(getCredentials("openai").apiKey).toBe("sk-persisted-key-12345");
  });
});

describe("deleteProviderKey", () => {
  it("removes a runtime-sourced key from both process.env and the persisted store", async () => {
    delete process.env.OPENAI_API_KEY;
    const { setProviderKey, deleteProviderKey, getCredentials, listCredentialStatus } =
      await freshModules();

    await setProviderKey("openai", "sk-to-be-deleted-123");
    expect(getCredentials("openai").apiKey).toBeTruthy();

    await deleteProviderKey("openai");
    expect(getCredentials("openai").apiKey).toBeUndefined();
    expect(listCredentialStatus().find((s) => s.provider === "openai")?.configured).toBe(false);
  });

  it("never deletes a real env-sourced key, even if delete is called", async () => {
    process.env.ANTHROPIC_API_KEY = "real-infra-key";
    const { deleteProviderKey, getCredentials } = await freshModules();

    await deleteProviderKey("anthropic");
    expect(getCredentials("anthropic").apiKey).toBe("real-infra-key");
  });
});
