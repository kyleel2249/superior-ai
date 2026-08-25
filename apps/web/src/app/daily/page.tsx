"use client";

import { useState } from "react";
import Link from "next/link";

interface Section {
  id: string;
  title: string;
  items: string[];
}

interface Brief {
  title: string;
  generatedAt: string;
  sections: Section[];
  focusToday: string[];
  disclaimer: string;
}

export default function DailyIntelligencePage() {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [objective, setObjective] = useState("Grow pipeline and ship quality");

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objective, product: "SUPERIOR AI", includeMemory: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setBrief(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-zinc-100">
      <header className="border-b border-[var(--card-border)] px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-200">
            ← Home
          </Link>
          <h1 className="text-lg font-semibold">Daily Intelligence</h1>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            className="rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm w-64"
            placeholder="Today's objective"
          />
          <button
            type="button"
            onClick={run}
            disabled={loading}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? "Building…" : "Generate brief"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8 space-y-6">
        {error && (
          <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        {!brief && !loading && (
          <p className="text-sm text-zinc-500">
            Generate a morning brief from KPIs, funnel events, memory cues, and focus items. Empty metrics stay empty.
          </p>
        )}

        {brief && (
          <>
            <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6">
              <h2 className="text-base font-semibold">{brief.title}</h2>
              <p className="text-xs text-zinc-500 mt-1">{brief.generatedAt}</p>
              <h3 className="mt-4 text-sm font-medium text-indigo-300">Focus today</h3>
              <ul className="mt-2 space-y-1">
                {brief.focusToday.map((f, i) => (
                  <li key={i} className="text-sm text-zinc-300">
                    · {f}
                  </li>
                ))}
              </ul>
            </div>

            {brief.sections.map((s) => (
              <section
                key={s.id}
                className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5"
              >
                <h3 className="text-sm font-medium text-zinc-200">{s.title}</h3>
                <ul className="mt-3 space-y-1.5">
                  {s.items.map((item, i) => (
                    <li key={i} className="text-sm text-zinc-400 leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            <p className="text-xs text-zinc-600">{brief.disclaimer}</p>
          </>
        )}
      </main>
    </div>
  );
}
