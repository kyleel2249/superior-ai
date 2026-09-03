/**
 * Credential manager — loads provider keys from env; never logs secrets.
 *
 * setProviderKey/deleteProviderKey below extend this with a UI-savable path:
 * a key saved from the UI is persisted encrypted via @superior-ai/storage
 * (survives restarts) and written into process.env for the current process,
 * so getCredentials()/assertCredentials() and every other existing
 * process.env.X_API_KEY read in this package picks it up with zero other
 * code changes. Real deployment env vars always take priority — a
 * runtime-saved key is only hydrated into process.env when the real env var
 * isn't already set, so the UI can never silently override infra config.
 */

import type { ProviderId } from "@superior-ai/core";
import type { ProviderCredentials } from "./providers/base";
import { logger } from "@superior-ai/core";
import { encryptSecret, decryptSecret, hashFingerprint } from "@superior-ai/shared";
import { putObject, getObject } from "@superior-ai/storage";

export interface CredentialStatus {
  provider: ProviderId;
  configured: boolean;
  source: "env" | "runtime" | "none";
  baseUrl?: string;
  keyFingerprint?: string;
  savedAt?: string;
}

function fingerprint(key: string): string {
  if (key.length < 8) return "****";
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}

const ENV_MAP: Array<{
  provider: ProviderId;
  key?: string;
  base?: string;
  org?: string;
}> = [
  { provider: "openai", key: "OPENAI_API_KEY", base: "OPENAI_BASE_URL", org: "OPENAI_ORG_ID" },
  { provider: "anthropic", key: "ANTHROPIC_API_KEY", base: "ANTHROPIC_BASE_URL" },
  { provider: "xai", key: "XAI_API_KEY", base: "XAI_BASE_URL" },
  { provider: "google", key: "GOOGLE_AI_API_KEY", base: "GOOGLE_AI_BASE_URL" },
  { provider: "openrouter", key: "OPENROUTER_API_KEY", base: "OPENROUTER_BASE_URL" },
  { provider: "local", key: "LOCAL_INFERENCE_API_KEY", base: "LOCAL_INFERENCE_URL" },
  {
    provider: "azure-openai",
    key: "AZURE_OPENAI_API_KEY",
    base: "AZURE_OPENAI_ENDPOINT",
  },
];

export function getCredentials(provider: ProviderId): ProviderCredentials {
  const row = ENV_MAP.find((e) => e.provider === provider);
  if (!row) return {};
  const apiKey = row.key ? process.env[row.key] : undefined;
  const baseUrl = row.base ? process.env[row.base] : undefined;
  const orgId = row.org ? process.env[row.org] : undefined;
  // Azure also needs deployment name in extra
  const extra: Record<string, string> = {};
  if (provider === "azure-openai" && process.env.AZURE_OPENAI_DEPLOYMENT) {
    extra.deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  }
  if (provider === "azure-openai" && process.env.AZURE_OPENAI_API_VERSION) {
    extra.apiVersion = process.env.AZURE_OPENAI_API_VERSION;
  }
  return {
    apiKey: apiKey || undefined,
    baseUrl: baseUrl || undefined,
    orgId: orgId || undefined,
    extra: Object.keys(extra).length ? extra : undefined,
  };
}

export function listCredentialStatus(): CredentialStatus[] {
  return ENV_MAP.map((row) => {
    const key = row.key ? process.env[row.key] : undefined;
    const base = row.base ? process.env[row.base] : undefined;
    const rec = runtimeRecordsCache.find((r) => r.provider === row.provider);
    const configured = Boolean(key) || (row.provider === "local" && Boolean(base));
    const source: CredentialStatus["source"] = !configured
      ? "none"
      : envPresentBeforeHydration.has(row.provider)
        ? "env"
        : runtimeSourced.has(row.provider)
          ? "runtime"
          : "env";
    return {
      provider: row.provider,
      configured,
      source,
      baseUrl: base,
      keyFingerprint: key ? fingerprint(key) : undefined,
      savedAt: rec?.savedAt,
    };
  });
}

export function assertCredentials(provider: ProviderId): ProviderCredentials {
  const creds = getCredentials(provider);
  if (!creds.apiKey && provider !== "local") {
    logger.warn("credentials.missing", { provider });
    throw new Error(`CONFIGURATION_REQUIRED: No API key for provider ${provider}`);
  }
  if (provider === "local" && !creds.baseUrl) {
    throw new Error("CONFIGURATION_REQUIRED: LOCAL_INFERENCE_URL not set");
  }
  return creds;
}

// ---------------------------------------------------------------------------
// Runtime save/persist path
// ---------------------------------------------------------------------------

const STORE_KEY = "credentials/provider-keys.json";

interface StoredRecord {
  provider: ProviderId;
  ciphertext: string;
  fingerprint: string;
  savedAt: string;
}

let runtimeRecordsCache: StoredRecord[] = [];
const runtimeSourced = new Set<ProviderId>();
const envPresentBeforeHydration = new Set<ProviderId>();
let hydrated = false;
let hydratePromise: Promise<void> | null = null;

async function loadStore(): Promise<StoredRecord[]> {
  const buf = await getObject(STORE_KEY);
  if (!buf) return [];
  try {
    return JSON.parse(buf.toString("utf8")) as StoredRecord[];
  } catch {
    return [];
  }
}

async function saveStore(records: StoredRecord[]): Promise<void> {
  await putObject(STORE_KEY, JSON.stringify(records, null, 2), {
    contentType: "application/json",
  });
}

/**
 * Hydrates process.env from any encrypted, previously-saved runtime keys.
 * Safe to call repeatedly — only does real work once. Also kicked off
 * best-effort at module load (below) so callers that never explicitly await
 * this still benefit once the first tick completes; routes that need a
 * guarantee (saving/listing/deleting a key) should still await it directly.
 */
export async function ensureCredentialsHydrated(): Promise<void> {
  if (hydrated) return;
  if (!hydratePromise) {
    hydratePromise = (async () => {
      for (const row of ENV_MAP) {
        if (row.key && process.env[row.key]) envPresentBeforeHydration.add(row.provider);
      }
      const records = await loadStore();
      runtimeRecordsCache = records;
      for (const rec of records) {
        const row = ENV_MAP.find((r) => r.provider === rec.provider);
        if (!row?.key) continue;
        if (process.env[row.key]) continue; // real env always wins
        try {
          process.env[row.key] = decryptSecret(rec.ciphertext);
          runtimeSourced.add(rec.provider);
        } catch (err) {
          logger.warn("credentials.hydrate_failed", {
            provider: rec.provider,
            error: String(err),
          });
        }
      }
      hydrated = true;
    })();
  }
  await hydratePromise;
}
void ensureCredentialsHydrated(); // best-effort at module load; see doc comment

export async function setProviderKey(
  provider: ProviderId,
  key: string
): Promise<CredentialStatus> {
  await ensureCredentialsHydrated();
  const row = ENV_MAP.find((r) => r.provider === provider);
  if (!row?.key) throw new Error(`Provider ${provider} does not accept a stored API key`);
  const trimmed = key.trim();
  if (trimmed.length < 8) throw new Error("Key looks too short to be valid");

  const ciphertext = encryptSecret(trimmed);
  const keyFingerprint = hashFingerprint(trimmed);
  const savedAt = new Date().toISOString();
  const records = await loadStore();
  const next = records.filter((r) => r.provider !== provider);
  next.push({ provider, ciphertext, fingerprint: keyFingerprint, savedAt });
  await saveStore(next);
  runtimeRecordsCache = next;

  // Real infra env still wins even for a fresh save — never shadow it.
  if (!envPresentBeforeHydration.has(provider)) {
    process.env[row.key] = trimmed;
    runtimeSourced.add(provider);
  }

  logger.info("credentials.provider_key_saved", { provider, fingerprint: keyFingerprint });
  return listCredentialStatus().find((s) => s.provider === provider)!;
}

export async function deleteProviderKey(provider: ProviderId): Promise<void> {
  await ensureCredentialsHydrated();
  const row = ENV_MAP.find((r) => r.provider === provider);
  const records = await loadStore();
  const next = records.filter((r) => r.provider !== provider);
  await saveStore(next);
  runtimeRecordsCache = next;
  if (row?.key && runtimeSourced.has(provider)) {
    delete process.env[row.key];
    runtimeSourced.delete(provider);
  }
  logger.info("credentials.provider_key_deleted", { provider });
}

/** Test-only: forces re-hydration on the next call. */
export function __resetCredentialsHydrationForTests(): void {
  hydrated = false;
  hydratePromise = null;
  runtimeSourced.clear();
  envPresentBeforeHydration.clear();
  runtimeRecordsCache = [];
}
