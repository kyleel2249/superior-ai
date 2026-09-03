"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface QueueJob {
  id: string;
  lane: string;
  type: string;
  status: "waiting" | "active" | "completed" | "failed" | "delayed";
  priority: number;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  error?: string;
}

interface QueueSnapshot {
  backend: string;
  stats: Record<string, number>;
  jobs: QueueJob[];
}

const STATUS_COLOR: Record<QueueJob["status"], string> = {
  waiting: "#94a3b8",
  active: "#38bdf8",
  completed: "#34d399",
  failed: "#fb7185",
  delayed: "#fbbf24",
};

const STATUS_GLOW: Record<QueueJob["status"], string> = {
  waiting: "card-glow--indigo",
  active: "card-glow--cyan",
  completed: "card-glow--emerald",
  failed: "card-glow--fuchsia",
  delayed: "card-glow--amber",
};

function timeAgo(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-white/5 min-w-[84px]">
      <div className="text-2xl font-bold tabular-nums" style={{ color }}>
        {value}
      </div>
      <div className="text-[11px] uppercase tracking-wide text-zinc-400">{label}</div>
    </div>
  );
}

export default function QueuePage() {
  const [data, setData] = useState<QueueSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [enqueuing, setEnqueuing] = useState(false);
  const [pulseIds, setPulseIds] = useState<Set<string>>(new Set());
  const prevJobs = useRef<Map<string, string>>(new Map());

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/queue");
      const json = (await res.json()) as QueueSnapshot;

      // Detect jobs whose status just changed, so we can flash them —
      // real change detection off the live payload, not a fake timer.
      const changed = new Set<string>();
      for (const job of json.jobs) {
        const prevStatus = prevJobs.current.get(job.id);
        if (prevStatus && prevStatus !== job.status) changed.add(job.id);
        prevJobs.current.set(job.id, job.status);
      }
      setPulseIds(changed);
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(load, 2000);
    return () => clearInterval(interval);
  }, [autoRefresh, load]);

  const spawnDemoJob = async (shouldFail: boolean) => {
    setEnqueuing(true);
    try {
      await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: shouldFail ? "demo_fail" : "echo",
          payload: { note: "spawned from /admin/queue dashboard" },
          priority: Math.floor(Math.random() * 100),
        }),
      });
      await load();
    } finally {
      setEnqueuing(false);
    }
  };

  const stats = data?.stats ?? {};
  const total = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      <div className="animate-fade-up flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Job Queue</h1>
          <p className="mt-2 text-sm text-zinc-400 max-w-xl">
            Live view of the real in-memory job queue — backend:{" "}
            <span className="chip">{data?.backend ?? "…"}</span>. Bounded worker pool now
            processes highest-priority jobs first once saturated.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh((v) => !v)}
            className={`chip cursor-pointer ${autoRefresh ? "border-emerald-500/50 text-emerald-300" : ""}`}
          >
            {autoRefresh ? "● live" : "○ paused"}
          </button>
          <button
            onClick={() => spawnDemoJob(false)}
            disabled={enqueuing}
            className="btn-rainbow rounded-lg px-4 py-2 text-sm disabled:opacity-50"
          >
            + Enqueue demo job
          </button>
          <button
            onClick={() => spawnDemoJob(true)}
            disabled={enqueuing}
            className="chip cursor-pointer border-rose-500/50 text-rose-300"
          >
            + Enqueue failing job
          </button>
        </div>
      </div>

      {error && (
        <div className="card-glow card-glow--amber rounded-xl p-4 text-amber-200 text-sm animate-fade-up">
          Couldn&apos;t reach /api/queue: {error}
        </div>
      )}

      <div className="card-glow rounded-2xl p-6 flex flex-wrap gap-3 animate-fade-up">
        <StatPill label="Total" value={total} color="#a5b4fc" />
        <StatPill label="Waiting" value={stats.waiting ?? 0} color={STATUS_COLOR.waiting} />
        <StatPill label="Active" value={stats.active ?? 0} color={STATUS_COLOR.active} />
        <StatPill label="Completed" value={stats.completed ?? 0} color={STATUS_COLOR.completed} />
        <StatPill label="Failed" value={stats.failed ?? 0} color={STATUS_COLOR.failed} />
      </div>

      <div className="space-y-2">
        {(data?.jobs ?? []).map((job, i) => {
          const isPulsing = pulseIds.has(job.id);
          return (
            <div
              key={job.id}
              className={`card-glow ${STATUS_GLOW[job.status]} rounded-xl px-4 py-3 flex items-center justify-between gap-4 animate-fade-up ${
                isPulsing ? "animate-pulse-glow" : ""
              }`}
              style={{ animationDelay: `${Math.min(i, 20) * 40}ms` }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={{
                    background: STATUS_COLOR[job.status],
                    boxShadow:
                      job.status === "active" ? `0 0 8px ${STATUS_COLOR[job.status]}` : "none",
                  }}
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate">{job.type}</div>
                  <div className="text-xs text-zinc-500 truncate">
                    {job.lane} · priority {job.priority} · attempt {job.attempts}/{job.maxAttempts}
                    {job.error ? ` · ${job.error}` : ""}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span
                  className="chip"
                  style={{ color: STATUS_COLOR[job.status], borderColor: STATUS_COLOR[job.status] + "60" }}
                >
                  {job.status}
                </span>
                <span className="text-xs text-zinc-500 w-16 text-right">
                  {timeAgo(job.updatedAt)}
                </span>
              </div>
            </div>
          );
        })}
        {data && data.jobs.length === 0 && (
          <div className="text-center text-zinc-500 text-sm py-10 animate-fade-up">
            No jobs yet — enqueue a demo job above to see it move through the queue live.
          </div>
        )}
      </div>
    </div>
  );
}
