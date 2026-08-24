/**
 * Environment configuration loader — single source for foundation settings.
 */

export interface AppConfig {
  nodeEnv: string;
  appName: string;
  appUrl: string;
  databaseUrl?: string;
  redisUrl?: string;
  logLevel: string;
  storageRoot: string;
  featureFlags: Record<string, boolean>;
}

let cached: AppConfig | null = null;

function parseFlags(): Record<string, boolean> {
  const raw = process.env.FEATURE_FLAGS || "";
  const flags: Record<string, boolean> = {
    localFirst: true,
    billingUi: process.env.ENABLE_BILLING_UI === "1",
    codeExec: process.env.ALLOW_CODE_EXEC === "1",
    autonomousTools: process.env.ENABLE_AUTONOMOUS_TOOLS !== "0",
    multiEngineSearch: true,
  };
  for (const part of raw.split(",")) {
    const [k, v] = part.split("=").map((s) => s.trim());
    if (!k) continue;
    flags[k] = v === undefined ? true : v === "1" || v.toLowerCase() === "true";
  }
  return flags;
}

export function loadConfig(force = false): AppConfig {
  if (cached && !force) return cached;
  cached = {
    nodeEnv: process.env.NODE_ENV || "development",
    appName: process.env.APP_NAME || "SUPERIOR AI",
    appUrl: process.env.NEXT_PUBLIC_APP_URL || process.env.API_URL || "http://localhost:3000",
    databaseUrl: process.env.DATABASE_URL || undefined,
    redisUrl: process.env.REDIS_URL || undefined,
    logLevel: process.env.LOG_LEVEL || "info",
    storageRoot: process.env.OBJECT_STORAGE_ROOT || process.env.S3_BUCKET || ".data/objects",
    featureFlags: parseFlags(),
  };
  return cached;
}

export function isFeatureEnabled(flag: string): boolean {
  const cfg = loadConfig();
  return Boolean(cfg.featureFlags[flag]);
}

export function resetConfigCache(): void {
  cached = null;
}
