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

  const Btn = ({
    label,
    onClick,
    tone = "indigo",
  }: {
    label: string;
    onClick: () => void;
    tone?: string;
  }) => (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-full border border-white/10 bg-${tone}-600/40 hover:bg-${tone}-500/50 hover:scale-105 active:scale-95 transition-all duration-200 shadow-md shadow-${tone}-500/10 disabled:opacity-50`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen text-zinc-100">
      <header className="border-b border-fuchsia-500/20 px-4 sm:px-6 h-14 flex items-center gap-3 bg-black/20 backdrop-blur-md">
        <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">
          ← Home
        </Link>
        <h1 className="font-semibold text-gradient text-sm sm:text-base">Advanced AI Features</h1>
        <Link
          href="/admin/control"
          className="text-xs chip ml-auto hover:border-cyan-400/50"
        >
          Control Center
        </Link>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        <p className="text-sm text-zinc-400 animate-fade-up">
          Colorful, responsive control surface for CINTEXA advanced engines. Results stream into the
          panel below.
        </p>

        <section className="card-glow rounded-2xl p-5 space-y-3 animate-fade-up">
          <h2 className="text-sm font-medium text-indigo-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            Digital Twin
          </h2>
          <input
            value={twinName}
            onChange={(e) => setTwinName(e.target.value)}
            className="w-full rounded-xl border border-indigo-500/30 bg-black/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40"
            placeholder="Company name"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading}
              className="btn-rainbow text-xs px-4 py-1.5 rounded-full"
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
              className="chip"
              onClick={() => get("twins")}
            >
              List twins
            </button>
          </div>
        </section>

        <section className="card-glow rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-medium text-violet-200">Scenario Simulator</h2>
          <input
            value={baseline}
            onChange={(e) => setBaseline(e.target.value)}
            className="w-40 rounded-xl border border-violet-500/30 bg-black/40 px-3 py-2 text-sm"
            placeholder="Baseline"
          />
          <button
            type="button"
            className="btn-rainbow text-xs px-4 py-1.5 rounded-full block"
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

        <section className="card-glow rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-medium text-emerald-200">Sandbox / Canary</h2>
          <input
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            className="w-full rounded-xl border border-emerald-500/30 bg-black/40 px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            {[
              ["Sandbox checks", () => post("sandbox", { modelId })],
              ["Promote", () => post("promote", { modelId })],
              ["Start 5% canary", () => post("canary_start", { modelId, percent: 5 })],
              ["Advance canary", () => post("canary_advance", { modelId })],
              ["List canaries", () => get("canaries")],
            ].map(([label, fn]) => (
              <button key={String(label)} type="button" className="chip" onClick={fn as () => void}>
                {label as string}
              </button>
            ))}
          </div>
        </section>

        <section className="card-glow rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-medium text-amber-200">Continuous Verification</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="chip"
              onClick={() => post("verify_start", { taskId: `demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` })}
            >
              Start loop
            </button>
            <button type="button" className="chip" onClick={() => get("verification")}>
              List loops
            </button>
          </div>
        </section>

        <section className="card-glow rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-medium text-sky-200">Marketplace & more</h2>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="chip" onClick={() => get("marketplace")}>
              Browse packs
            </button>
            <button
              type="button"
              className="chip"
              onClick={() => post("marketplace_install", { packId: "pack.growth.smb" })}
            >
              Install SMB Growth
            </button>
            <button
              type="button"
              className="chip"
              onClick={() =>
                post("opportunities", {
                  hasChurnPressure: true,
                  hasManualOps: true,
                  hasStrongNps: true,
                })
              }
            >
              Opportunities
            </button>
            <button
              type="button"
              className="chip"
              onClick={() => post("workforce_pnl", {})}
            >
              Workforce P&amp;L
            </button>
            <button
              type="button"
              className="chip"
              onClick={() => post("portfolio", {})}
            >
              Portfolio
            </button>
            <button
              type="button"
              className="chip"
              onClick={() =>
                post("experiment_create", {
                  hypothesis: "Frontier vs balanced on coding",
                  variants: ["frontier", "balanced"],
                })
              }
            >
              Experiment
            </button>
            <button
              type="button"
              className="chip"
              onClick={() => post("templates_list", {})}
            >
              Agent templates
            </button>
            <button
              type="button"
              className="chip"
              onClick={() =>
                post("goal_upsert", {
                  id: "g1",
                  level: "company",
                  title: "Grow MRR",
                  kpi: "mrr",
                  target: 120000,
                })
              }
            >
              Upsert goal
            </button>
            <button
              type="button"
              className="chip"
              onClick={() => post("goal_align", { taskSummary: "Improve MRR retention playbooks" })}
            >
              Align task
            </button>
            <button
              type="button"
              className="chip"
              onClick={() => post("research_gather", { query: twinName + " market overview", allEngines: true })}
            >
              Multi-engine research
            </button>
          </div>
        </section>

        <pre
          className={`card-glow rounded-2xl p-4 text-[11px] text-cyan-100/80 whitespace-pre-wrap max-h-96 overflow-auto font-mono transition-opacity ${
            loading ? "opacity-60" : "opacity-100"
          }`}
        >
          {result || (loading ? "Loading…" : "✨ Results appear here")}
        </pre>
      </main>
    </div>
  );
}
