"use client";

import { useCallback, useEffect, useState } from "react";

interface AuditEvent {
  id: string;
  at: string;
  action: string;
  actorEmail?: string;
  outcome: "success" | "failure" | "denied";
  resourceType?: string;
  resourceId?: string;
}

interface AuditSnapshot {
  stats: { total: number; byOutcome: Record<string, number> };
  events: AuditEvent[];
}

const OUTCOME_COLOR: Record<string, string> = {
  success: "#34d399",
  failure: "#fb7185",
  denied: "#fbbf24",
};

export default function AuditPage() {
  const [data, setData] = useState<AuditSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState("");
  const [unauthorized, setUnauthorized] = useState(false);

  const load = useCallback(async () => {
    try {
      const qs = actionFilter ? `?action=${encodeURIComponent(actionFilter)}` : "";
      const res = await fetch(`/api/audit${qs}`, { credentials: "include" });
      if (res.status === 401) {
        setUnauthorized(true);
        return;
      }
      const json = (await res.json()) as AuditSnapshot;
      setData(json);
      setUnauthorized(false);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [actionFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const total = data?.stats.total ?? 0;
  const byOutcome = data?.stats.byOutcome ?? {};

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 space-y-8">
      <div className="animate-fade-up">
        <h1 className="text-3xl font-bold text-gradient">Audit Log</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-xl">
          Real security event stream — every login, config change, and privileged action, kept
          in an append-only ring buffer. Requires an authenticated session in production.
        </p>
      </div>

      {unauthorized && (
        <div className="card-glow card-glow--amber rounded-xl p-4 text-amber-200 text-sm animate-fade-up">
          Sign in to view the audit log — this endpoint correctly requires authentication in
          production and is refusing an unauthenticated request right now.
        </div>
      )}

      {error && (
        <div className="card-glow card-glow--amber rounded-xl p-4 text-amber-200 text-sm animate-fade-up">
          {error}
        </div>
      )}

      {data && (
        <>
          <div className="card-glow rounded-2xl p-6 flex flex-wrap gap-3 animate-fade-up">
            <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-white/5 min-w-[84px]">
              <div className="text-2xl font-bold tabular-nums">{total}</div>
              <div className="text-[11px] uppercase tracking-wide text-zinc-400">Total</div>
            </div>
            {Object.entries(byOutcome).map(([outcome, count]) => (
              <div
                key={outcome}
                className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-white/5 min-w-[84px]"
              >
                <div
                  className="text-2xl font-bold tabular-nums"
                  style={{ color: OUTCOME_COLOR[outcome] ?? "#94a3b8" }}
                >
                  {count}
                </div>
                <div className="text-[11px] uppercase tracking-wide text-zinc-400">{outcome}</div>
              </div>
            ))}
          </div>

          <div className="card-glow rounded-2xl p-4 animate-fade-up">
            <input
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              placeholder="Filter by action (e.g. auth, billing, admin)…"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-400/60"
            />
          </div>

          <div className="space-y-2">
            {data.events.map((e, i) => (
              <div
                key={e.id}
                className="card-glow rounded-xl px-4 py-3 flex items-center justify-between gap-4 animate-fade-up"
                style={{ animationDelay: `${Math.min(i, 20) * 30}ms` }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{ background: OUTCOME_COLOR[e.outcome] ?? "#94a3b8" }}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white truncate">{e.action}</div>
                    <div className="text-xs text-zinc-500 truncate">
                      {e.actorEmail ?? "system"}
                      {e.resourceType ? ` · ${e.resourceType}${e.resourceId ? `:${e.resourceId}` : ""}` : ""}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-zinc-500 flex-shrink-0">
                  {new Date(e.at).toLocaleTimeString()}
                </span>
              </div>
            ))}
            {data.events.length === 0 && (
              <div className="text-center text-zinc-500 text-sm py-10 animate-fade-up">
                No events match this filter.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
