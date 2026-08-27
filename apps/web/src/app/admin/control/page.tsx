"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Tab =
  | "overview"
  | "models"
  | "cascade"
  | "council"
  | "quality"
  | "credits"
  | "routing";

export default function AiControlCenterPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [task, setTask] = useState("Design a multi-tenant billing architecture with failover");
  const [output, setOutput] = useState(
    "We recommend a modular billing service with Stripe adapters, idempotent webhooks, and staged rollout."
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    const res = await fetch("/api/cintexa");
    setData(await res.json());
  }, []);

  useEffect(() => {
    loadOverview().catch((e) => setError(String(e)));
  }, [loadOverview]);

  async function run(action: string, body: Record<string, unknown> = {}) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cintexa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...body }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Request failed");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function loadModels() {
    setLoading(true);
    try {
      const res = await fetch("/api/cintexa?view=models");
      setData(await res.json());
      setTab("models");
    } finally {
      setLoading(false);
    }
  }

  async function loadCredits() {
    const res = await fetch("/api/cintexa?view=credits");
    setData(await res.json());
    setTab("credits");
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "models", label: "Models" },
    { id: "cascade", label: "Cascade" },
    { id: "council", label: "Council" },
    { id: "quality", label: "Quality" },
    { id: "credits", label: "Credits" },
    { id: "routing", label: "Routing" },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-zinc-100">
      <header className="border-b border-[var(--card-border)] bg-[var(--card)]/90 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-zinc-400 hover:text-white">
              ← Home
            </Link>
            <h1 className="font-semibold text-sm md:text-base">
              CINTEXA AI Control Center
            </h1>
          </div>
          <Link href="/admin/providers" className="text-xs text-indigo-300 hover:text-indigo-200">
            Providers
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                if (t.id === "models") loadModels();
                if (t.id === "credits") loadCredits();
                if (t.id === "overview") loadOverview();
              }}
              className={`text-xs px-3 py-1.5 rounded-full border ${
                tab === t.id
                  ? "border-indigo-500 bg-indigo-500/20 text-white"
                  : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <section className="card-glow p-5 space-y-3 animate-fade-up">
          <label className="text-xs text-zinc-500">Task / objective</label>
          <textarea
            value={task}
            onChange={(e) => setTask(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => run("cascade", { text: task })}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium hover:bg-indigo-500 disabled:opacity-50"
            >
              Plan cascade
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => run("council", { objective: task })}
              className="rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium hover:bg-violet-500 disabled:opacity-50"
            >
              Plan council
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => run("quality", { outputText: output, instruction: task, highRisk: true })}
              className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-medium hover:bg-emerald-600 disabled:opacity-50"
            >
              Score quality
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => run("reasoning", { mode: "Deep", underlying: "openai" })}
              className="rounded-md border border-zinc-600 px-3 py-1.5 text-xs hover:border-zinc-400 disabled:opacity-50"
            >
              Reasoning map
            </button>
          </div>
          {tab === "quality" && (
            <textarea
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              rows={4}
              placeholder="Paste model output to score"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            />
          )}
        </section>

        <section className="card-glow card-glow--cyan p-5 animate-fade-up" style={{animationDelay: "80ms"}}>
          <h2 className="text-sm font-medium text-zinc-300 mb-3">Result</h2>
          <pre className="text-[11px] text-zinc-400 whitespace-pre-wrap overflow-x-auto max-h-[480px] font-mono leading-relaxed">
            {data ? JSON.stringify(data, null, 2) : loading ? "Loading…" : "—"}
          </pre>
        </section>

        <p className="text-xs text-zinc-600">
          Internal credits are unlimited. Model availability depends on OpenRouter configuration and
          health checks. Product tiers (SuperGrok) are not treated as foundation models.
        </p>
      </main>
    </div>
  );
}
