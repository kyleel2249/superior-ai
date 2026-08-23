"use client";
import Link from "next/link";
import { useState } from "react";

interface ResearchResult {
  ourProduct: string;
  profiles: Array<{ name: string; website: string; positioning?: string; contentTopics?: string[] }>;
  scorecard: {
    opportunityMap: string[];
    threatMap: string[];
    seoGap: string[];
    contentGap: string[];
  };
  searchHits: Array<{ title: string; url: string; snippet: string }>;
  pageFetches: Array<{ url: string; title?: string; excerpt?: string; success: boolean; error?: string }>;
  trafficShells: Array<{ domain: string; provenance: string; confidence: number; note: string }>;
  comparisons: string[];
  notes: string[];
  provenance: string;
  error?: string;
}

export default function CompetitorWarRoom() {
  const [ourProduct, setOurProduct] = useState("SUPERIOR AI");
  const [urls, setUrls] = useState("https://openai.com\nhttps://anthropic.com");
  const [focus, setFocus] = useState("positioning product features go-to-market");
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ourProduct,
          urls: urls.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean),
          focus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Research failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-zinc-100">
      <header className="border-b border-[var(--card-border)] bg-[var(--card)] px-6 h-14 flex items-center gap-4">
        <Link href="/" className="text-zinc-400 hover:text-white text-sm">
          ← Home
        </Link>
        <h1 className="font-semibold">Competitor War Room</h1>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <p className="text-zinc-400 text-sm leading-relaxed">
          Live public search + page fetch · Structured comparison · Traffic shells with provenance.
          Never fabricates metrics or contacts.
        </p>

        <section className="grid gap-4 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6">
          <label className="text-sm">
            <span className="text-zinc-400">Our product</span>
            <input
              value={ourProduct}
              onChange={(e) => setOurProduct(e.target.value)}
              className="mt-1 w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="text-zinc-400">Competitor URLs (one per line)</span>
            <textarea
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3 py-2 font-mono text-xs"
            />
          </label>
          <label className="text-sm">
            <span className="text-zinc-400">Focus</span>
            <input
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              className="mt-1 w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3 py-2"
            />
          </label>
          <button
            onClick={run}
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 font-medium w-fit"
          >
            {loading ? "Researching…" : "Run war-room research"}
          </button>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </section>

        {result && (
          <div className="space-y-6">
            <p className="text-xs text-zinc-500">{result.provenance}</p>

            <section className="grid md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-emerald-900/50 bg-emerald-950/20 p-5">
                <h2 className="font-semibold text-emerald-300 mb-2">Opportunities</h2>
                <ul className="text-sm space-y-1 text-zinc-300">
                  {result.scorecard.opportunityMap.map((x) => (
                    <li key={x}>· {x}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-amber-900/50 bg-amber-950/20 p-5">
                <h2 className="font-semibold text-amber-300 mb-2">Threats</h2>
                <ul className="text-sm space-y-1 text-zinc-300">
                  {result.scorecard.threatMap.map((x) => (
                    <li key={x}>· {x}</li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5 space-y-3">
              <h2 className="font-semibold">Profiles & page fetches</h2>
              {result.pageFetches.map((p) => (
                <div key={p.url} className="text-sm border-b border-zinc-800 pb-3">
                  <div className="flex justify-between gap-2">
                    <a href={p.url} className="text-indigo-400 hover:underline truncate" target="_blank" rel="noreferrer">
                      {p.title || p.url}
                    </a>
                    <span className={p.success ? "text-emerald-400" : "text-red-400"}>
                      {p.success ? "observed" : "failed"}
                    </span>
                  </div>
                  {p.excerpt && <p className="text-zinc-400 mt-1 line-clamp-3">{p.excerpt}</p>}
                  {p.error && <p className="text-red-400/80 text-xs">{p.error}</p>}
                </div>
              ))}
            </section>

            {result.searchHits.length > 0 && (
              <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5 space-y-2">
                <h2 className="font-semibold">Live search hits</h2>
                {result.searchHits.slice(0, 12).map((h) => (
                  <div key={h.url + h.title} className="text-sm">
                    <a href={h.url} className="text-indigo-400 hover:underline" target="_blank" rel="noreferrer">
                      {h.title}
                    </a>
                    <p className="text-zinc-500 text-xs">{h.snippet}</p>
                  </div>
                ))}
              </section>
            )}

            <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5 space-y-3">
              <h2 className="font-semibold">Traffic shells (no invented numbers)</h2>
              {result.trafficShells.map((t) => (
                <div key={t.domain} className="text-sm text-zinc-400">
                  <strong className="text-zinc-200">{t.domain}</strong> · {t.provenance} · confidence{" "}
                  {t.confidence}% — {t.note}
                </div>
              ))}
            </section>

            <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5">
              <h2 className="font-semibold mb-2">Comparison templates</h2>
              <pre className="whitespace-pre-wrap text-xs text-zinc-400">
                {result.comparisons.join("\n\n")}
              </pre>
            </section>

            {result.notes.length > 0 && (
              <section className="text-xs text-zinc-500 space-y-1">
                {result.notes.map((n, i) => (
                  <div key={i}>· {n}</div>
                ))}
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
