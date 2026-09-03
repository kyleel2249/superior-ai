"use client";

import { useCallback, useEffect, useState } from "react";

interface EngineDescriptor {
  id: string;
  name: string;
  category: string;
  requiresKeys: string[];
  configured: boolean;
  notes: string;
}

interface SearchHit {
  title: string;
  url: string;
  snippet: string;
  engine?: string;
}

const CATEGORY_COLOR: Record<string, string> = {
  global: "#38bdf8",
  privacy: "#34d399",
  regional: "#fbbf24",
  alternative: "#a78bfa",
  computational: "#fb7185",
  meta: "#94a3b8",
};

export default function SearchEnginesPage() {
  const [engines, setEngines] = useState<EngineDescriptor[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[] | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/search?view=engines");
      const json = (await res.json()) as { engines: EngineDescriptor[] };
      setEngines(json.engines);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setResults(null);
    setStatus(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&mode=auto`);
      const json = await res.json();
      setResults(json.results ?? []);
      setStatus(json.status ?? (json.results?.length ? "OK" : "UNAVAILABLE"));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSearching(false);
    }
  };

  const configuredCount = engines.filter((e) => e.configured).length;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 space-y-8">
      <div className="animate-fade-up">
        <h1 className="text-3xl font-bold text-gradient">Search Engines</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-xl">
          Real engine registry — {configuredCount} of {engines.length} configured in this
          environment. Unconfigured engines report it honestly rather than faking results.
        </p>
      </div>

      {error && (
        <div className="card-glow card-glow--amber rounded-xl p-4 text-amber-200 text-sm animate-fade-up">
          {error}
        </div>
      )}

      <div className="card-glow rounded-2xl p-6 animate-fade-up">
        <div className="flex gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            placeholder="Try a real search…"
            className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-400/60"
          />
          <button
            onClick={runSearch}
            disabled={searching || !query.trim()}
            className="btn-rainbow rounded-lg px-4 py-2 text-sm disabled:opacity-50"
          >
            {searching ? "Searching…" : "Search"}
          </button>
        </div>
        {status && (
          <div className="mt-3 text-xs text-zinc-500">
            status: <span className="text-zinc-300">{status}</span>
          </div>
        )}
        {results && results.length === 0 && (
          <div className="mt-4 text-sm text-zinc-500">
            No live results — no keyless engine (e.g. DuckDuckGo) succeeded and no keyed engine is
            configured in this environment.
          </div>
        )}
        {results && results.length > 0 && (
          <div className="mt-4 space-y-3">
            {results.slice(0, 8).map((r, i) => (
              <div key={r.url} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-cyan-300 hover:underline"
                >
                  {r.title}
                </a>
                <p className="text-xs text-zinc-500 mt-0.5">{r.snippet}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {engines.map((e, i) => (
          <div
            key={e.id}
            className="card-glow rounded-xl p-4 animate-fade-up"
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-white">{e.name}</span>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  color: e.configured ? "#34d399" : "#71717a",
                  background: e.configured ? "rgba(52,211,153,0.12)" : "rgba(113,113,122,0.12)",
                }}
              >
                {e.configured ? "CONFIGURED" : "NOT SET"}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded"
                style={{ color: CATEGORY_COLOR[e.category] ?? "#94a3b8" }}
              >
                {e.category}
              </span>
              {e.requiresKeys.length > 0 && (
                <span className="text-[10px] text-zinc-600 font-mono">
                  {e.requiresKeys.join(", ")}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500">{e.notes}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
