"use client";

import { useState } from "react";
import Link from "next/link";
import { GlowCard, Perspective, Reveal3D } from "@/components/GlowUI";

async function call(action: string, body: Record<string, unknown> = {}) {
  const res = await fetch("/api/advanced", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...body }),
  });
  return res.json();
}
async function getView(view: string) {
  const res = await fetch(`/api/advanced?view=${view}`);
  return res.json();
}

export default function IntelligenceOpsPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Knowledge graph
  const [kgStats, setKgStats] = useState<{ entities: number; relations: number } | null>(null);

  // Capacity planner
  const [expectedTasksPerDay, setExpectedTasksPerDay] = useState(500);
  const [avgLatencySec, setAvgLatencySec] = useState(4);
  const [concurrency, setConcurrency] = useState(10);
  const [growthPctPerWeek, setGrowthPctPerWeek] = useState(5);
  const [capacityPlan, setCapacityPlan] = useState<{
    dailyThroughput: number; utilization: number; queueRisk: string;
    weeklyForecast: { week: number; tasks: number; utilization: number }[]; recommendations: string[];
  } | null>(null);

  // Root cause
  const [rcTitle, setRcTitle] = useState("Support tickets spiked 40%");
  const [rcSymptom, setRcSymptom] = useState("Support ticket volume up 40% week over week");
  const [rootCauseGraph, setRootCauseGraph] = useState<{ id: string; nodes: { label: string; type: string }[] } | null>(null);

  // Predictive alerts
  const [alertKind, setAlertKind] = useState("revenue");
  const [alertName, setAlertName] = useState("Monthly Revenue");
  const [alertValues, setAlertValues] = useState("50000,52000,48000,35000");
  const [alerts, setAlerts] = useState<{ id: string; title: string; message: string; severity: string; confidence: number }[]>([]);

  async function run(fn: () => Promise<void>) {
    setLoading(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const loadKnowledge = () => run(async () => setKgStats(await getView("knowledge")));
  const planCapacity = () =>
    run(async () => {
      const r = await call("capacity_plan", { expectedTasksPerDay, avgLatencySec, concurrency, growthPctPerWeek });
      if (r.error) throw new Error(r.error);
      setCapacityPlan(r);
    });
  const buildRootCause = () =>
    run(async () => {
      const r = await call("root_cause_create", { title: rcTitle, symptom: rcSymptom });
      if (r.error) throw new Error(r.error);
      setRootCauseGraph(r);
    });
  const evaluateAlert = () =>
    run(async () => {
      const values = alertValues.split(",").map((v) => Number(v.trim())).filter((v) => !Number.isNaN(v));
      const r = await call("alert_evaluate", { kind: alertKind, name: alertName, values });
      if (r.error) throw new Error(r.error);
      if (r.alert) setAlerts((prev) => [r.alert, ...prev]);
      else setAlerts((prev) => [{ id: "none", title: "No alert triggered", message: "Change was within normal thresholds.", severity: "info", confidence: 1 }, ...prev]);
    });

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--card-border)] bg-[var(--card)]/90 px-6 h-14 flex items-center gap-4 sticky top-0 z-40">
        <Link href="/admin/control" className="text-sm text-zinc-400 hover:text-white">
          ← Control Center
        </Link>
        <h1 className="font-semibold text-sm">Intelligence Ops — Knowledge, Capacity, Root Cause, Alerts</h1>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <Perspective className="space-y-8">
          {error && (
            <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 animate-fade-up">{error}</div>
          )}

          <Reveal3D>
            <GlowCard variant="cyan" className="p-6 space-y-3">
              <h2 className="text-sm font-semibold text-zinc-300">Knowledge Graph</h2>
              <p className="text-xs text-zinc-500">Real entity/relation counts from the shared knowledge graph — not estimated.</p>
              <button onClick={loadKnowledge} disabled={loading} className="rounded-lg bg-cyan-700 hover:bg-cyan-600 px-4 py-2 text-sm font-medium disabled:opacity-50">
                Refresh stats
              </button>
              {kgStats && (
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="chip">{kgStats.entities} entities</span>
                  <span className="chip">{kgStats.relations} relations</span>
                </div>
              )}
            </GlowCard>
          </Reveal3D>

          <Reveal3D delayMs={60}>
            <GlowCard variant="indigo" className="p-6 space-y-4">
              <h2 className="text-sm font-semibold text-zinc-300">Capacity Planner</h2>
              <div className="grid sm:grid-cols-4 gap-3">
                <label className="text-xs text-zinc-500 space-y-1">
                  Expected tasks/day
                  <input type="number" value={expectedTasksPerDay} onChange={(e) => setExpectedTasksPerDay(Number(e.target.value))} className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white" />
                </label>
                <label className="text-xs text-zinc-500 space-y-1">
                  Avg latency (sec)
                  <input type="number" value={avgLatencySec} onChange={(e) => setAvgLatencySec(Number(e.target.value))} className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white" />
                </label>
                <label className="text-xs text-zinc-500 space-y-1">
                  Concurrency
                  <input type="number" value={concurrency} onChange={(e) => setConcurrency(Number(e.target.value))} className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white" />
                </label>
                <label className="text-xs text-zinc-500 space-y-1">
                  Growth %/week
                  <input type="number" value={growthPctPerWeek} onChange={(e) => setGrowthPctPerWeek(Number(e.target.value))} className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white" />
                </label>
              </div>
              <button onClick={planCapacity} disabled={loading} className="btn-rainbow px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                Plan capacity
              </button>
              {capacityPlan && (
                <div className="grid sm:grid-cols-3 gap-3 mt-2 text-sm">
                  <div className="rounded-lg bg-zinc-900 p-3">
                    <div className="text-[10px] text-zinc-500 uppercase">Daily throughput</div>
                    <div className="text-lg font-semibold">{capacityPlan.dailyThroughput.toLocaleString()}</div>
                  </div>
                  <div className="rounded-lg bg-zinc-900 p-3">
                    <div className="text-[10px] text-zinc-500 uppercase">Utilization</div>
                    <div className="text-lg font-semibold">{(capacityPlan.utilization * 100).toFixed(0)}%</div>
                  </div>
                  <div className="rounded-lg bg-zinc-900 p-3">
                    <div className="text-[10px] text-zinc-500 uppercase">Queue risk</div>
                    <div className={`text-lg font-semibold ${capacityPlan.queueRisk === "high" ? "text-rose-400" : capacityPlan.queueRisk === "medium" ? "text-amber-400" : "text-emerald-400"}`}>
                      {capacityPlan.queueRisk}
                    </div>
                  </div>
                  {capacityPlan.recommendations.length > 0 && (
                    <ul className="sm:col-span-3 text-xs text-zinc-400 space-y-1 list-disc list-inside">
                      {capacityPlan.recommendations.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </GlowCard>
          </Reveal3D>

          <Reveal3D delayMs={120}>
            <GlowCard variant="amber" className="p-6 space-y-4">
              <h2 className="text-sm font-semibold text-zinc-300">Root-Cause Graph</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="text-xs text-zinc-500 space-y-1">
                  Title
                  <input value={rcTitle} onChange={(e) => setRcTitle(e.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white" />
                </label>
                <label className="text-xs text-zinc-500 space-y-1">
                  Symptom
                  <input value={rcSymptom} onChange={(e) => setRcSymptom(e.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white" />
                </label>
              </div>
              <button onClick={buildRootCause} disabled={loading} className="rounded-lg bg-amber-700 hover:bg-amber-600 px-4 py-2 text-sm font-medium disabled:opacity-50">
                Build root-cause graph
              </button>
              {rootCauseGraph && (
                <div className="mt-2 grid sm:grid-cols-3 gap-2">
                  {rootCauseGraph.nodes.map((n, i) => (
                    <div key={i} className={`rounded-lg p-2 text-xs ${n.type === "symptom" ? "bg-rose-950/40 text-rose-200" : "bg-zinc-900 text-zinc-300"}`}>
                      <div className="text-[9px] uppercase text-zinc-500">{n.type}</div>
                      {n.label}
                    </div>
                  ))}
                </div>
              )}
            </GlowCard>
          </Reveal3D>

          <Reveal3D delayMs={180}>
            <GlowCard variant="fuchsia" className="p-6 space-y-4">
              <h2 className="text-sm font-semibold text-zinc-300">Predictive Alerts</h2>
              <p className="text-xs text-zinc-500">
                Detects a bad-direction change between the last two values in a series (drop for revenue/pipeline, rise for churn/support).
                Every alert states its assumptions honestly — never claims external market data it doesn&apos;t have.
              </p>
              <div className="grid sm:grid-cols-3 gap-3">
                <label className="text-xs text-zinc-500 space-y-1">
                  Kind
                  <select value={alertKind} onChange={(e) => setAlertKind(e.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white">
                    <option value="revenue">revenue</option>
                    <option value="pipeline">pipeline</option>
                    <option value="cash">cash</option>
                    <option value="churn">churn</option>
                    <option value="support">support</option>
                  </select>
                </label>
                <label className="text-xs text-zinc-500 space-y-1">
                  Series name
                  <input value={alertName} onChange={(e) => setAlertName(e.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white" />
                </label>
                <label className="text-xs text-zinc-500 space-y-1">
                  Values (comma-separated, oldest→newest)
                  <input value={alertValues} onChange={(e) => setAlertValues(e.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white" />
                </label>
              </div>
              <button onClick={evaluateAlert} disabled={loading} className="rounded-lg bg-fuchsia-700 hover:bg-fuchsia-600 px-4 py-2 text-sm font-medium disabled:opacity-50">
                Evaluate
              </button>
              <div className="space-y-2 mt-2">
                {alerts.map((a, i) => (
                  <div key={`${a.id}-${i}`} className={`rounded-lg p-3 text-sm ${a.severity === "critical" ? "bg-rose-950/40 text-rose-200" : a.severity === "warning" ? "bg-amber-950/30 text-amber-200" : "bg-zinc-900 text-zinc-400"}`}>
                    <div className="font-medium">{a.title}</div>
                    <div className="text-xs mt-1">{a.message}</div>
                  </div>
                ))}
              </div>
            </GlowCard>
          </Reveal3D>
        </Perspective>
      </main>
    </div>
  );
}
