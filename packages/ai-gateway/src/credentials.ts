/**
 * Credential manager — loads provider keys from env; never logs secrets.
 */

import type { ProviderId } from "@superior-ai/core";
import type { ProviderCredentials } from "./providers/base";
import { logger } from "@superior-ai/core";

export interface CredentialStatus {
  provider: ProviderId;
  configured: boolean;
  source: "env" | "none";
  baseUrl?: string;
  keyFingerprint?: string;
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
    return {
      provider: row.provider,
      configured: Boolean(key) || (row.provider === "local" && Boolean(base)),
      source: key || base ? "env" : "none",
      baseUrl: base,
      keyFingerprint: key ? fingerprint(key) : undefined,
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
