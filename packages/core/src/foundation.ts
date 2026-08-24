/**
 * Phase 1 foundation health snapshot — no secrets.
 */

import { loadConfig } from "./config";
import { listFlags } from "./flags";
import { getEventHistory } from "./events";

export interface FoundationHealth {
  status: "ok" | "degraded";
  config: {
    appName: string;
    nodeEnv: string;
    hasDatabaseUrl: boolean;
    hasRedisUrl: boolean;
    storageRoot: string;
  };
  flags: Record<string, boolean>;
  subsystems: Array<{ id: string; status: "up" | "down" | "optional"; detail?: string }>;
  eventHistoryCount: number;
  checkedAt: string;
}

export function getFoundationHealth(extra?: {
  databaseReady?: boolean;
  queueReady?: boolean;
  cacheKeys?: number;
}): FoundationHealth {
  const cfg = loadConfig();
  const subsystems: FoundationHealth["subsystems"] = [
    { id: "config", status: "up" },
    { id: "event_bus", status: "up", detail: `history=${getEventHistory(5).length}` },
    {
      id: "database",
      status: extra?.databaseReady ? "up" : cfg.databaseUrl ? "optional" : "optional",
      detail: cfg.databaseUrl ? "DATABASE_URL set" : "no DATABASE_URL — in-memory fallbacks",
    },
    {
      id: "redis_queue",
      status: extra?.queueReady ? "up" : cfg.redisUrl ? "optional" : "optional",
      detail: cfg.redisUrl ? "REDIS_URL set" : "in-memory queue",
    },
    {
      id: "cache",
      status: "up",
      detail: extra?.cacheKeys !== undefined ? `keys=${extra.cacheKeys}` : "memory",
    },
    {
      id: "object_storage",
      status: "up",
      detail: cfg.storageRoot,
    },
  ];

  return {
    status: "ok",
    config: {
      appName: cfg.appName,
      nodeEnv: cfg.nodeEnv,
      hasDatabaseUrl: Boolean(cfg.databaseUrl),
      hasRedisUrl: Boolean(cfg.redisUrl),
      storageRoot: cfg.storageRoot,
    },
    flags: listFlags(),
    subsystems,
    eventHistoryCount: getEventHistory(100).length,
    checkedAt: new Date().toISOString(),
  };
}
