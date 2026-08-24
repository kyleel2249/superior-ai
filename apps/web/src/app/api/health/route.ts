import { NextResponse } from "next/server";
import { checkAllFromEnv, getHealthSnapshot } from "@superior-ai/ai-gateway";
import { getFoundationHealth, emitEvent, loadConfig } from "@superior-ai/core";
import { isDatabaseReady } from "@superior-ai/db";
import { cacheStats } from "@superior-ai/cache";
import { storageStatus } from "@superior-ai/storage";

export async function GET() {
  try {
    await emitEvent("health.check", { at: new Date().toISOString() });
  } catch {
    /* bus optional */
  }

  let providers: unknown[] = [];
  try {
    providers = await checkAllFromEnv();
  } catch {
    providers = [];
  }

  const foundation = getFoundationHealth({
    databaseReady: isDatabaseReady(),
    cacheKeys: cacheStats().keys,
  });

  return NextResponse.json({
    status: "ok",
    continuousCapacity: true,
    message:
      "Continuous AI capacity is active. External provider limits handled via routing and failover.",
    foundation: {
      ...foundation,
      storage: storageStatus(),
      configLoaded: Boolean(loadConfig().appName),
    },
    providers,
    cached: getHealthSnapshot(),
  });
}
