"use client";

import { useCallback, useEffect, useState } from "react";

interface Variant {
  name: string;
  description: string;
}
interface Experiment {
  id: string;
  hypothesis: string;
  metric: string;
  variants: Variant[];
  status: string;
}

const VARIANT_COLOR = ["#38bdf8", "#34d399", "#fbbf24", "#fb7185"];

export default function GrowthPage() {
  const [opportunities, setOpportunities] = useState<string[]>([]);
  const [stages, setStages] = useState<string[]>([]);
  const [context, setContext] = useState("");
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    try {
      const res = await fetch("/api/growth");
      const json = (await res.json()) as { stages: string[]; opportunities: string[] };
      setStages(json.stages);
      setOpportunities(json.opportunities);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const generate = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/growth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "experiments", context: context || "growth" }),
      });
      const json = (await res.json()) as { experiments: Experiment[] };
      setExperiments(json.experiments);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 space-y-8">
      <div className="animate-fade-up">
        <h1 className="text-3xl font-bold text-gradient">Growth Experiments</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-xl">
          Real experiment proposals from the growth engine — each run generates fresh,
          non-colliding experiment ids.
        </p>
      </div>

      {error && (
        <div className="card-glow card-glow--amber rounded-xl p-4 text-amber-200 text-sm animate-fade-up">
          {error}
        </div>
      )}

      {stages.length > 0 && (
        <div className="card-glow card-glow--indigo rounded-2xl p-6 animate-fade-up">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">
            Growth stages
          </h2>
          <div className="flex flex-wrap gap-2">
            {stages.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <span className="chip capitalize">{s}</span>
                {i < stages.length - 1 && <span className="text-zinc-600">→</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card-glow card-glow--emerald rounded-2xl p-6 animate-fade-up">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">
          Growth opportunities
        </h2>
        <ul className="space-y-1.5">
          {opportunities.map((o, i) => (
            <li
              key={o}
              className="text-sm text-zinc-300 flex items-start gap-2 animate-fade-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <span className="text-emerald-400 mt-0.5">•</span>
              {o}
            </li>
          ))}
        </ul>
      </div>

      <div className="card-glow card-glow--cyan rounded-2xl p-6 animate-fade-up">
        <div className="flex gap-3">
          <input
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Context (e.g. 'checkout flow', 'onboarding')"
            className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-400/60"
          />
          <button
            onClick={generate}
            disabled={busy}
            className="btn-rainbow rounded-lg px-4 py-2 text-sm disabled:opacity-50"
          >
            {busy ? "Generating…" : "Generate experiments"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {experiments.map((exp, i) => (
          <div
            key={exp.id}
            className="card-glow rounded-xl p-5 animate-fade-up"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <p className="text-sm text-white">{exp.hypothesis}</p>
              <span className="chip flex-shrink-0">{exp.metric}</span>
            </div>
            <div className="text-[11px] text-zinc-500 font-mono mb-3">{exp.id}</div>
            <div className="flex flex-wrap gap-2">
              {exp.variants.map((v, vi) => (
                <div
                  key={v.name}
                  className="rounded-lg px-3 py-1.5 text-xs"
                  style={{
                    background: `${VARIANT_COLOR[vi % VARIANT_COLOR.length]}1a`,
                    color: VARIANT_COLOR[vi % VARIANT_COLOR.length],
                  }}
                >
                  <span className="font-semibold">{v.name}</span> — {v.description}
                </div>
              ))}
            </div>
          </div>
        ))}
        {experiments.length === 0 && (
          <div className="text-center text-zinc-500 text-sm py-10 animate-fade-up">
            Enter a context and generate experiments to see them here.
          </div>
        )}
      </div>
    </div>
  );
}
