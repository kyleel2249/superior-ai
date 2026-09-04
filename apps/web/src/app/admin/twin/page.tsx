"use client";

import { useState } from "react";
import Link from "next/link";
import { GlowCard, Perspective, Reveal3D } from "@/components/GlowUI";

interface TwinSnapshot {
  id: string;
  name: string;
  revenue: { monthly?: number; currency: string };
  costs: { monthly?: number; currency: string };
  employees: number;
  customers: { active?: number; churnRate?: number };
}

interface SimResult {
  twinId: string;
  projected: { monthlyRevenue?: number; monthlyCosts?: number; net?: number; activeCustomers?: number; notes: string[] };
  disclaimer: string;
}

interface ScenarioResult {
  id: string;
  name: string;
  kind: string;
  baseline: number;
  projected: number;
  delta: number;
  deltaPct: number;
  disclaimer: string;
}

async function call(action: string, body: Record<string, unknown> = {}) {
  const res = await fetch("/api/advanced", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...body }),
  });
  return res.json();
}

export default function DigitalTwinPage() {
  const [name, setName] = useState("My Company");
  const [monthlyRevenue, setMonthlyRevenue] = useState(50000);
  const [monthlyCosts, setMonthlyCosts] = useState(35000);
  const [employees, setEmployees] = useState(8);
  const [activeCustomers, setActiveCustomers] = useState(120);
  const [churnRate, setChurnRate] = useState(3);

  const [twin, setTwin] = useState<TwinSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pricingChangePct, setPricingChangePct] = useState(0);
  const [marketingSpendDelta, setMarketingSpendDelta] = useState(0);
  const [hiringDelta, setHiringDelta] = useState(0);
  const [simResult, setSimResult] = useState<SimResult | null>(null);

  const [scenarioMetric, setScenarioMetric] = useState("revenue");
  const [scenarioBaseline, setScenarioBaseline] = useState(50000);
  const [scenarios, setScenarios] = useState<ScenarioResult[] | null>(null);

  async function saveTwin() {
    setLoading(true);
    setError(null);
    try {
      const result = await call("twin_upsert", {
        twin: {
          id: twin?.id,
          name,
          revenue: { monthly: monthlyRevenue, currency: "USD" },
          costs: { monthly: monthlyCosts, currency: "USD" },
          employees,
          customers: { active: activeCustomers, churnRate: churnRate / 100 },
        },
      });
      if (result.error) throw new Error(result.error);
      setTwin(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function runSimulation() {
    if (!twin) return;
    setLoading(true);
    setError(null);
    try {
      const result = await call("twin_simulate", {
        twinId: twin.id,
        delta: {
          pricingChangePct: pricingChangePct || undefined,
          marketingSpendDelta: marketingSpendDelta || undefined,
          hiringDelta: hiringDelta || undefined,
        },
      });
      if (result.error) throw new Error(result.error);
      setSimResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function runScenarios() {
    setLoading(true);
    setError(null);
    try {
      const result = await call("scenario_set", {
        name: `${scenarioMetric} outlook`,
        metric: scenarioMetric,
        baseline: scenarioBaseline,
      });
      if (result.error) throw new Error(result.error);
      setScenarios(result.scenarios);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--card-border)] bg-[var(--card)]/90 px-6 h-14 flex items-center gap-4 sticky top-0 z-40">
        <Link href="/admin/control" className="text-sm text-zinc-400 hover:text-white">
          ← Control Center
        </Link>
        <h1 className="font-semibold text-sm">Digital Twin & Scenario Simulator</h1>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <Perspective className="space-y-8">
        {error && (
          <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 animate-fade-up">{error}</div>
        )}

        <Reveal3D>
        <GlowCard variant="indigo" className="p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-300">1. Build your digital twin</h2>
          <p className="text-xs text-zinc-500">
            A working internal representation of the business — outputs of any simulation below are estimates, never guaranteed outcomes.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-xs text-zinc-500 space-y-1">
              Company name
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white" />
            </label>
            <label className="text-xs text-zinc-500 space-y-1">
              Employees
              <input type="number" value={employees} onChange={(e) => setEmployees(Number(e.target.value))} className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white" />
            </label>
            <label className="text-xs text-zinc-500 space-y-1">
              Monthly revenue ($)
              <input type="number" value={monthlyRevenue} onChange={(e) => setMonthlyRevenue(Number(e.target.value))} className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white" />
            </label>
            <label className="text-xs text-zinc-500 space-y-1">
              Monthly costs ($)
              <input type="number" value={monthlyCosts} onChange={(e) => setMonthlyCosts(Number(e.target.value))} className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white" />
            </label>
            <label className="text-xs text-zinc-500 space-y-1">
              Active customers
              <input type="number" value={activeCustomers} onChange={(e) => setActiveCustomers(Number(e.target.value))} className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white" />
            </label>
            <label className="text-xs text-zinc-500 space-y-1">
              Monthly churn rate (%)
              <input type="number" value={churnRate} onChange={(e) => setChurnRate(Number(e.target.value))} className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white" />
            </label>
          </div>
          <button
            onClick={saveTwin}
            disabled={loading}
            className="btn-rainbow px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {twin ? "Update twin" : "Create twin"}
          </button>
          {twin && <p className="text-xs text-emerald-400">Twin saved: {twin.id}</p>}
        </GlowCard>
        </Reveal3D>

        {twin && (
          <Reveal3D>
          <GlowCard variant="cyan" className="p-6 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-300">2. Simulate a change</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              <label className="text-xs text-zinc-500 space-y-1">
                Pricing change (%)
                <input type="number" value={pricingChangePct} onChange={(e) => setPricingChangePct(Number(e.target.value))} className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white" />
              </label>
              <label className="text-xs text-zinc-500 space-y-1">
                Marketing spend delta ($)
                <input type="number" value={marketingSpendDelta} onChange={(e) => setMarketingSpendDelta(Number(e.target.value))} className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white" />
              </label>
              <label className="text-xs text-zinc-500 space-y-1">
                Hiring delta (headcount)
                <input type="number" value={hiringDelta} onChange={(e) => setHiringDelta(Number(e.target.value))} className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white" />
              </label>
            </div>
            <button onClick={runSimulation} disabled={loading} className="rounded-lg bg-cyan-700 hover:bg-cyan-600 px-5 py-2 text-sm font-medium disabled:opacity-50">
              Run simulation
            </button>
            {simResult && (
              <div className="mt-3 grid sm:grid-cols-4 gap-3 text-sm">
                <div className="rounded-lg bg-zinc-900 p-3">
                  <div className="text-[10px] text-zinc-500 uppercase">Projected revenue</div>
                  <div className="text-lg font-semibold">${simResult.projected.monthlyRevenue?.toLocaleString() ?? "—"}</div>
                </div>
                <div className="rounded-lg bg-zinc-900 p-3">
                  <div className="text-[10px] text-zinc-500 uppercase">Projected costs</div>
                  <div className="text-lg font-semibold">${simResult.projected.monthlyCosts?.toLocaleString() ?? "—"}</div>
                </div>
                <div className="rounded-lg bg-zinc-900 p-3">
                  <div className="text-[10px] text-zinc-500 uppercase">Net</div>
                  <div className="text-lg font-semibold">${simResult.projected.net?.toLocaleString() ?? "—"}</div>
                </div>
                <div className="rounded-lg bg-zinc-900 p-3">
                  <div className="text-[10px] text-zinc-500 uppercase">Active customers</div>
                  <div className="text-lg font-semibold">{simResult.projected.activeCustomers?.toLocaleString() ?? "—"}</div>
                </div>
                <p className="sm:col-span-4 text-xs text-amber-400/80">{simResult.disclaimer}</p>
              </div>
            )}
          </GlowCard>
          </Reveal3D>
        )}

        <Reveal3D delayMs={100}>
        <GlowCard variant="amber" className="p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-300">3. Best / base / worst case scenarios</h2>
          <div className="flex flex-wrap gap-3 items-end">
            <label className="text-xs text-zinc-500 space-y-1">
              Metric
              <input value={scenarioMetric} onChange={(e) => setScenarioMetric(e.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white" />
            </label>
            <label className="text-xs text-zinc-500 space-y-1">
              Baseline value
              <input type="number" value={scenarioBaseline} onChange={(e) => setScenarioBaseline(Number(e.target.value))} className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white" />
            </label>
            <button onClick={runScenarios} disabled={loading} className="rounded-lg bg-amber-700 hover:bg-amber-600 px-5 py-2 text-sm font-medium disabled:opacity-50">
              Run scenarios
            </button>
          </div>
          {scenarios && (
            <div className="grid sm:grid-cols-3 gap-3 mt-3">
              {scenarios.map((s, i) => (
                <div key={s.id} className="rounded-lg bg-zinc-900 p-3 animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="text-[10px] text-zinc-500 uppercase">{s.kind.replace("_", " ")}</div>
                  <div className="text-lg font-semibold">{s.projected.toLocaleString()}</div>
                  <div className={`text-xs ${s.delta >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {s.delta >= 0 ? "+" : ""}
                    {s.deltaPct.toFixed(1)}%
                  </div>
                </div>
              ))}
              <p className="sm:col-span-3 text-xs text-amber-400/80">{scenarios[0]?.disclaimer}</p>
            </div>
          )}
        </GlowCard>
        </Reveal3D>
        </Perspective>
      </main>
    </div>
  );
}
