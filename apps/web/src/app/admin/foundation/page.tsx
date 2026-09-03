"use client";

import { useCallback, useEffect, useState } from "react";

interface FoundationSnapshot {
  foundation: {
    status: "ok" | "degraded";
    subsystems: Array<{ id: string; status: "up" | "down" | "optional"; detail?: string }>;
    checkedAt: string;
  };
  flags: Record<string, boolean>;
  config: {
    appName: string;
    nodeEnv: string;
    storageRoot: string;
    hasDatabaseUrl: boolean;
    hasRedisUrl: boolean;
  };
  events: Array<{ event: string; payload: unknown; at: string }>;
  storage: { backend: string; ready: boolean };
}

function FlagChip({ name, enabled }: { name: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
      <span className="text-sm text-zinc-300 font-mono">{name}</span>
      <span
        className="text-xs font-semibold px-2 py-0.5 rounded-full"
        style={{
          color: enabled ? "#34d399" : "#71717a",
          background: enabled ? "rgba(52,211,153,0.12)" : "rgba(113,113,122,0.12)",
        }}
      >
        {enabled ? "ON" : "OFF"}
      </span>
    </div>
  );
}

export default function FoundationPage() {
  const [data, setData] = useState<FoundationSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emitting, setEmitting] = useState(false);
  const [newEventFlash, setNewEventFlash] = useState(false);
  const [cacheKeys, setCacheKeys] = useState<number | null>(null);
  const [cachingBusy, setCachingBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/foundation");
      const json = (await res.json()) as FoundationSnapshot;
      setData(json);
      const cacheSubsystem = json.foundation.subsystems.find((s) => s.id === "cache");
      const parsed = cacheSubsystem?.detail?.match(/keys=(\d+)/)?.[1];
      setCacheKeys(parsed !== undefined ? Number(parsed) : 0);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const emitTestEvent = async () => {
    setEmitting(true);
    try {
      await fetch("/api/foundation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "emit",
          event: "dashboard.ping",
          payload: { from: "/admin/foundation", at: new Date().toISOString() },
        }),
      });
      await load();
      setNewEventFlash(true);
      setTimeout(() => setNewEventFlash(false), 1200);
    } finally {
      setEmitting(false);
    }
  };

  const addCacheEntry = async () => {
    setCachingBusy(true);
    try {
      await fetch("/api/foundation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cache_set",
          key: `demo:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
          value: { note: "set from /admin/foundation" },
          ttlMs: 60_000,
        }),
      });
      await load();
    } finally {
      setCachingBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 space-y-8">
      <div className="animate-fade-up">
        <h1 className="text-3xl font-bold text-gradient">Platform Foundation</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-xl">
          Live config, feature flags, and event bus — all read directly from the running process,
          nothing hardcoded into this page.
        </p>
      </div>

      {error && (
        <div className="card-glow card-glow--amber rounded-xl p-4 text-amber-200 text-sm animate-fade-up">
          {error}
        </div>
      )}

      {data && (
        <>
          <div className="grid sm:grid-cols-2 gap-4 animate-fade-up">
            <div className="card-glow card-glow--indigo rounded-2xl p-5">
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">
                Config
              </h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-zinc-500">App</dt>
                  <dd className="text-white">{data.config.appName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Environment</dt>
                  <dd className="text-white">{data.config.nodeEnv}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Database configured</dt>
                  <dd style={{ color: data.config.hasDatabaseUrl ? "#34d399" : "#fbbf24" }}>
                    {data.config.hasDatabaseUrl ? "yes" : "no"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Redis configured</dt>
                  <dd style={{ color: data.config.hasRedisUrl ? "#34d399" : "#fbbf24" }}>
                    {data.config.hasRedisUrl ? "yes" : "no"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Storage backend</dt>
                  <dd className="text-white">{data.storage.backend}</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-zinc-500">Cache keys (TTL, in-memory)</dt>
                  <dd className="flex items-center gap-2">
                    <span className="text-white tabular-nums">{cacheKeys ?? "…"}</span>
                    <button
                      onClick={addCacheEntry}
                      disabled={cachingBusy}
                      className="chip cursor-pointer border-cyan-500/50 text-cyan-300 text-[10px] px-1.5 py-0.5 disabled:opacity-50"
                    >
                      +1
                    </button>
                  </dd>
                </div>
              </dl>
              <div className="mt-4 pt-3 border-t border-white/10">
                <div className="text-[11px] text-zinc-500 uppercase tracking-wide mb-2">
                  Subsystems
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {data.foundation.subsystems.map((s) => (
                    <span
                      key={s.id}
                      title={s.detail}
                      className="chip"
                      style={{
                        color: s.status === "up" ? "#34d399" : s.status === "down" ? "#fb7185" : "#94a3b8",
                      }}
                    >
                      {s.id}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="card-glow card-glow--cyan rounded-2xl p-5">
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">
                Feature flags
              </h2>
              <div className="space-y-1.5">
                {Object.entries(data.flags).map(([name, enabled]) => (
                  <FlagChip key={name} name={name} enabled={enabled} />
                ))}
              </div>
              <p className="mt-3 text-[11px] text-zinc-500">
                Env-controlled — change via FEATURE_FLAGS / ENABLE_* vars and restart.
              </p>
            </div>
          </div>

          <div className="card-glow card-glow--emerald rounded-2xl p-6 animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
                Event bus
              </h2>
              <button
                onClick={emitTestEvent}
                disabled={emitting}
                className="btn-rainbow rounded-lg px-3 py-1.5 text-xs disabled:opacity-50"
              >
                {emitting ? "Emitting…" : "Emit test event"}
              </button>
            </div>
            <div className="space-y-2">
              {data.events.length === 0 && (
                <div className="text-center text-zinc-500 text-sm py-6">No events yet.</div>
              )}
              {[...data.events].reverse().map((e, i) => (
                <div
                  key={`${e.event}-${e.at}-${i}`}
                  className={`flex items-center justify-between text-xs rounded-lg px-3 py-2 bg-white/5 animate-fade-up ${
                    i === 0 && newEventFlash ? "animate-pulse-glow" : ""
                  }`}
                >
                  <span className="text-zinc-300 font-mono">{e.event}</span>
                  <span className="text-zinc-500">{new Date(e.at).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
