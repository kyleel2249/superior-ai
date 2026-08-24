import { NextRequest, NextResponse } from "next/server";
import {
  getFoundationHealth,
  listFlags,
  loadConfig,
  emitEvent,
  getEventHistory,
  onEvent,
} from "@superior-ai/core";
import { cacheGet, cacheSet, cacheStats } from "@superior-ai/cache";
import { putObject, getObject, listObjects, storageStatus } from "@superior-ai/storage";
import { isDatabaseReady } from "@superior-ai/db";
import { enqueue } from "@superior-ai/queue";

export async function GET() {
  return NextResponse.json({
    foundation: getFoundationHealth({
      databaseReady: isDatabaseReady(),
      cacheKeys: cacheStats().keys,
    }),
    flags: listFlags(),
    config: {
      appName: loadConfig().appName,
      nodeEnv: loadConfig().nodeEnv,
      storageRoot: loadConfig().storageRoot,
      hasDatabaseUrl: Boolean(loadConfig().databaseUrl),
      hasRedisUrl: Boolean(loadConfig().redisUrl),
    },
    events: getEventHistory(20),
    storage: storageStatus(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action ?? "");

    if (action === "emit") {
      await emitEvent(String(body.event ?? "test"), body.payload ?? {});
      return NextResponse.json({ ok: true, history: getEventHistory(5) });
    }

    if (action === "cache_set") {
      cacheSet(String(body.key), body.value, Number(body.ttlMs ?? 60_000));
      return NextResponse.json({ ok: true, stats: cacheStats() });
    }

    if (action === "cache_get") {
      return NextResponse.json({ value: cacheGet(String(body.key)), stats: cacheStats() });
    }

    if (action === "storage_put") {
      const result = await putObject(
        String(body.key ?? `test/${Date.now()}.txt`),
        String(body.content ?? "superior-ai-phase1")
      );
      return NextResponse.json({ ok: true, result });
    }

    if (action === "storage_get") {
      const buf = await getObject(String(body.key));
      return NextResponse.json({
        ok: Boolean(buf),
        content: buf ? buf.toString("utf8") : null,
      });
    }

    if (action === "storage_list") {
      return NextResponse.json({ objects: await listObjects(String(body.prefix ?? "")) });
    }

    if (action === "enqueue") {
      const job = enqueue({
        type: String(body.type ?? "noop"),
        payload: body.payload ?? {},
        lane: body.lane ?? "background",
      });
      return NextResponse.json({ ok: true, job });
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
