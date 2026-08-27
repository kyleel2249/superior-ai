"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface KpiDef {
  id: string;
  name: string;
  category: string;
  unit: string;
  description: string;
}

interface KpiStatus {
  kpi: KpiDef;
  value: number | null;
  status: "ok" | "watch" | "alert" | "no_data";
  note: string;
}

interface Briefing {
  title: string;
  period: string;
  highlights: string[];
  risks: string[];
  narrative: string;
  kpiStatuses: KpiStatus[];
  disclaimer: string;
}


const MOCK_OBSERVED: Record<string, string> = {
  sessions: "18420",
  leads: "312",
  sql: "74",
  cvr: "1.7",
  pipeline: "240000",
  revenue: "58000",
  churn: "2.4",
  nps: "42",
  uptime: "99.95",
  cycle_time: "6",
};

const statusColor: Record<string, string> = {
  ok: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  watch: "bg-amber-500/20 text-amber-200 border-amber-500/40",
  alert: "bg-rose-500/20 text-rose-200 border-rose-500/40",
  no_data: "bg-zinc-700/40 text-zinc-400 border-zinc-600",
};

export default function KpiDashboardPage() {
  const [kpis, setKpis] = useState<KpiDef[]>([]);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/analytics?view=kpis")
      .then((r) => r.json())
      .then((d) => {
        setKpis(d.kpis ?? []);
        setInputs(MOCK_OBSERVED);
      })
      .catch((e) => setError(String(e)));
  }, []);

  useEffect(() => {
    // Auto-build briefing once KPIs loaded with mock observed values
    if (kpis.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const observed = Object.entries(MOCK_OBSERVED).map(([kpiId, value]) => ({
          kpiId,
          value: Number(value),
          period: "demo-2026-W34",
          source: "mock_dashboard",
          observedAt: new Date().toISOString(),
        }));
        const res = await fetch("/api/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "briefing",
            observed,
            title: "KPI Dashboard (Demo Data)",
            period: "demo-2026-W34",
            highlights: ["Demo metrics preloaded — replace with live connectors"],
          }),
        });
        const data = await res.json();
        if (!cancelled && res.ok) setBriefing(data);
      } catch {
        /* ignore auto-brief errors */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [kpis.length]);

  const runBriefing = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const observed = Object.entries(inputs)
        .filter(([, v]) => v.trim() !== "" && !Number.isNaN(Number(v)))
        .map(([kpiId, value]) => ({
          kpiId,
          value: Number(value),
          period: new Date().toISOString().slice(0, 10),
          source: "dashboard_entry",
          observedAt: new Date().toISOString(),
        }));
      const res = await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "briefing", observed, title: "KPI Dashboard Briefing" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setBriefing(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [inputs]);

  const statuses = briefing?.kpiStatuses;

  return (
    <div className="min-h-screen bg-[var(--background)] text-zinc-100">
      <header className="border-b border-[var(--card-border)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-200">
            ← Home
          </Link>
          <h1 className="text-lg font-semibold tracking-tight">KPI Dashboard</h1>
        </div>
        <p className="text-xs text-zinc-500 max-w-md text-right">
          Enter observed metrics only. Empty fields stay <span className="text-zinc-400">no_data</span> — nothing is invented.
        </p>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-100">
          <strong className="font-medium">Demo mode:</strong> Mock observed KPIs are preloaded for UI testing.
          Values are illustrative only — not live business data. Clear fields or connect analytics/CRM for real numbers.
        </div>

        {error && (
          <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <section className="card-glow p-6 animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-zinc-300">Observed metrics</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setInputs(MOCK_OBSERVED)}
                className="rounded-md border border-zinc-600 px-3 py-2 text-sm text-zinc-300 hover:border-zinc-400"
              >
                Load mock data
              </button>
              <button
                type="button"
                onClick={() => setInputs({})}
                className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-500 hover:border-zinc-500"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={runBriefing}
                disabled={loading}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500 disabled:opacity-50"
              >
                {loading ? "Building…" : "Generate briefing"}
              </button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {kpis.map((k) => (
              <label key={k.id} className="block rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
                <span className="text-xs text-zinc-500 uppercase tracking-wide">{k.category}</span>
                <span className="mt-1 block text-sm font-medium">{k.name}</span>
                <span className="text-xs text-zinc-500">{k.description}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder={k.unit}
                  value={inputs[k.id] ?? ""}
                  onChange={(e) => setInputs((prev) => ({ ...prev, [k.id]: e.target.value }))}
                  className="mt-2 w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm outline-none focus:border-indigo-500"
                />
              </label>
            ))}
          </div>
        </section>

        {statuses && (
          <section>
            <h2 className="mb-4 text-sm font-medium text-zinc-300">Status board</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {statuses.map((s) => (
                <div
                  key={s.kpi.id}
                  className={`rounded-xl border p-4 ${statusColor[s.status] ?? statusColor.no_data}`}
                >
                  <div className="text-xs uppercase tracking-wide opacity-80">{s.status}</div>
                  <div className="mt-1 text-sm font-semibold">{s.kpi.name}</div>
                  <div className="mt-2 text-2xl font-semibold tabular-nums">
                    {s.value == null ? "—" : s.value}
                    {s.value != null && (
                      <span className="ml-1 text-xs font-normal opacity-70">{s.kpi.unit}</span>
                    )}
                  </div>
                  <div className="mt-2 text-[11px] opacity-70 leading-snug">{s.note}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {briefing && (
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="card-glow card-glow--indigo p-6 animate-fade-up">
              <h2 className="text-sm font-medium text-zinc-300">{briefing.title}</h2>
              <p className="mt-1 text-xs text-zinc-500">{briefing.period}</p>
              <p className="mt-4 text-sm text-zinc-300 leading-relaxed">{briefing.narrative}</p>
              <ul className="mt-4 space-y-1">
                {briefing.highlights.map((h, i) => (
                  <li key={i} className="text-sm text-zinc-400">
                    · {h}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
              <h2 className="text-sm font-medium text-amber-200">Risks & gaps</h2>
              <ul className="mt-3 space-y-2">
                {briefing.risks.length ? (
                  briefing.risks.map((r, i) => (
                    <li key={i} className="text-sm text-amber-100/90">
                      · {r}
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-zinc-500">No risks from supplied data</li>
                )}
              </ul>
              <p className="mt-6 text-xs text-zinc-500 leading-relaxed">{briefing.disclaimer}</p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
