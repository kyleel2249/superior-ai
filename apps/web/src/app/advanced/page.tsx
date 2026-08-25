"use client";

import Link from "next/link";
import { useState } from "react";

export default function AdvancedFeaturesPage() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [twinName, setTwinName] = useState("Acme SaaS");
  const [baseline, setBaseline] = useState("100000");
  const [modelId, setModelId] = useState("openrouter:openai/gpt-4o");

  async function post(action: string, body: Record<string, unknown> = {}) {
    setLoading(true);
    try {
      const res = await fetch("/api/advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...body }),
      });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (e) {
      setResult(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function get(view: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/advanced?view=${view}`);
      setResult(JSON.stringify(await res.json(), null, 2));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-zinc-100">
      <header className="border-b border-[var(--card-border)] px-6 h-14 flex items-center gap-4">
        <Link href="/" className="text-sm text-zinc-400 hover:text-white">
          ← Home
        </Link>
        <h1 className="font-semibold">Advanced AI Features</h1>
        <Link href="/admin/control" className="text-xs text-indigo-300 ml-auto">
          Control Center
        </Link>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <section className="rounded-xl border border-zinc-800 p-5 space-y-3">
          <h2 className="text-sm font-medium text-indigo-200">Digital Twin</h2>
          <input
            value={twinName}
            onChange={(e) => setTwinName(e.target.value)}
            className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            placeholder="Company name"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded bg-indigo-600"
              onClick={() =>
                post("twin_upsert", {
                  twin: {
                    name: twinName,
                    revenue: { monthly: Number(baseline) || 0, currency: "USD" },
                    costs: { monthly: (Number(baseline) || 0) * 0.6, currency: "USD" },
                    employees: 25,
                    customers: { active: 400, churnRate: 3 },
                    departments: ["Sales", "Eng", "Marketing"],
                    goals: ["Grow MRR", "Reduce churn"],
                  },
                })
              }
            >
              Upsert twin
            </button>
            <button
              type="button"
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded border border-zinc-600"
              onClick={() => get("twins")}
            >
              List twins
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-800 p-5 space-y-3">
          <h2 className="text-sm font-medium text-violet-200">Scenario Simulator</h2>
          <input
            value={baseline}
            onChange={(e) => setBaseline(e.target.value)}
            className="w-40 rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            placeholder="Baseline"
          />
          <button
            type="button"
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded bg-violet-600 block"
            onClick={() =>
              post("scenario_set", {
                name: twinName,
                metric: "monthly_revenue",
                baseline: Number(baseline) || 0,
              })
            }
          >
            Run best/base/worst/stress
          </button>
        </section>

        <section className="rounded-xl border border-zinc-800 p-5 space-y-3">
          <h2 className="text-sm font-medium text-emerald-200">Sandbox / Canary</h2>
          <input
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="text-xs px-3 py-1.5 rounded bg-emerald-700"
              onClick={() => post("sandbox", { modelId })}
            >
              Sandbox checks
            </button>
            <button
              type="button"
              className="text-xs px-3 py-1.5 rounded border border-zinc-600"
              onClick={() => post("promote", { modelId })}
            >
              Promote
            </button>
            <button
              type="button"
              className="text-xs px-3 py-1.5 rounded border border-zinc-600"
              onClick={() => post("canary_start", { modelId, percent: 5 })}
            >
              Start 5% canary
            </button>
            <button
              type="button"
              className="text-xs px-3 py-1.5 rounded border border-zinc-600"
              onClick={() => post("canary_advance", { modelId })}
            >
              Advance canary
            </button>
            <button
              type="button"
              className="text-xs px-3 py-1.5 rounded border border-zinc-600"
              onClick={() => get("canaries")}
            >
              List canaries
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-800 p-5 space-y-3">
          <h2 className="text-sm font-medium text-amber-200">Continuous Verification</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="text-xs px-3 py-1.5 rounded bg-amber-700"
              onClick={() => post("verify_start", { taskId: `demo_${Date.now()}` })}
            >
              Start loop
            </button>
            <button
              type="button"
              className="text-xs px-3 py-1.5 rounded border border-zinc-600"
              onClick={() => get("verification")}
            >
              List loops
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-800 p-5 space-y-3">
          <h2 className="text-sm font-medium text-sky-200">Agent Marketplace</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="text-xs px-3 py-1.5 rounded bg-sky-700"
              onClick={() => get("marketplace")}
            >
              Browse packs
            </button>
            <button
              type="button"
              className="text-xs px-3 py-1.5 rounded border border-zinc-600"
              onClick={() => post("marketplace_install", { packId: "pack.growth.smb" })}
            >
              Install SMB Growth
            </button>
            <button
              type="button"
              className="text-xs px-3 py-1.5 rounded border border-zinc-600"
              onClick={() => post("marketplace_rate", { packId: "pack.growth.smb", stars: 5 })}
            >
              Rate 5★
            </button>
          </div>
        </section>

        <pre className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-[11px] text-zinc-400 whitespace-pre-wrap max-h-96 overflow-auto font-mono">
          {result || (loading ? "Loading…" : "Results appear here")}
        </pre>
      </main>
    </div>
  );
}
