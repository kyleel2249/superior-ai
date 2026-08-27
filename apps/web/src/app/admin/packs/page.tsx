"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface RankedPack {
  id: string;
  name: string;
  version: string;
  category: string;
  description: string;
  agents: string[];
  pricing: string;
  verified: boolean;
  score: number;
  rank: number;
  reasons: string[];
  metrics: {
    installs: number;
    ratingAvg: number | null;
    ratingCount: number;
  };
}

export default function PacksAdminPage() {
  const [ranked, setRanked] = useState<RankedPack[]>([]);
  const [installed, setInstalled] = useState<Array<{ packId: string }>>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [useRanked, setUseRanked] = useState(true);
  const [query, setQuery] = useState("");
  const [searchMeta, setSearchMeta] = useState<string | null>(null);

  async function load(q?: string) {
    const search = (q ?? query).trim();
    let url = useRanked
      ? "/api/packs?organizationId=org_dev&ranked=1"
      : "/api/packs?organizationId=org_dev";
    if (search) {
      url += `&q=${encodeURIComponent(search)}`;
    }
    const res = await fetch(url);
    const data = await res.json();
    if (data.hits) {
      setRanked(
        data.hits.map((h: { pack: RankedPack; score: number; method: string; highlights: string[] }, i: number) => ({
          ...h.pack,
          score: h.score,
          rank: i + 1,
          reasons: [h.method, ...(h.highlights || [])],
          metrics: { installs: 0, ratingAvg: null, ratingCount: 0 },
        }))
      );
      setSearchMeta(
        `method=${data.method} · embeddings=${data.embeddingAvailable ? "yes" : "lexical fallback"}`
      );
    } else if (data.ranked) {
      setRanked(data.ranked);
      setSearchMeta(search ? "ranked search" : null);
    } else {
      setRanked(
        (data.catalog ?? []).map((p: RankedPack, i: number) => ({
          ...p,
          score: 0,
          rank: i + 1,
          reasons: [],
          metrics: { installs: 0, ratingAvg: null, ratingCount: 0 },
        }))
      );
      setSearchMeta(null);
    }
    setInstalled(data.installed ?? []);
  }

  useEffect(() => {
    load().catch(console.error);
  }, [useRanked]);

  async function install(packId: string) {
    setMsg(null);
    const res = await fetch("/api/packs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "install", packId, organizationId: "org_dev" }),
    });
    const data = await res.json();
    setMsg(data.ok ? `Installed ${packId}` : data.error);
    await load();
  }

  async function uninstall(packId: string) {
    await fetch("/api/packs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "uninstall", packId, organizationId: "org_dev" }),
    });
    await load();
  }

  async function rate(packId: string, stars: number) {
    await fetch("/api/packs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "rate", packId, stars }),
    });
    await load();
  }

  async function feature(packId: string) {
    await fetch("/api/packs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "feature", packId, featured: true }),
    });
    await load();
  }

  async function checkout(packId: string) {
    setMsg(null);
    const res = await fetch("/api/packs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "checkout",
        packId,
        organizationId: "org_dev",
        email: "billing@example.com",
      }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    setMsg(data.error || "Checkout unavailable");
  }

  const installedSet = new Set(installed.map((i) => i.packId));

  return (
    <div className="min-h-screen bg-[var(--background)] text-white">
      <header className="border-b border-zinc-800 px-6 py-4 flex gap-4 items-center flex-wrap">
        <Link href="/" className="text-sm text-zinc-400 hover:text-white">
          SUPERIOR AI
        </Link>
        <span className="text-zinc-600">/</span>
        <Link href="/admin/overview" className="text-sm text-zinc-400 hover:text-white">
          Admin
        </Link>
        <span className="text-zinc-600">/</span>
        <h1 className="font-medium">Agent packs</h1>
        <label className="ml-auto text-xs text-zinc-400 flex items-center gap-2">
          <input
            type="checkbox"
            checked={useRanked}
            onChange={(e) => setUseRanked(e.target.checked)}
          />
          Marketplace ranking
        </label>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        <p className="text-sm text-zinc-400">
          Semantic search (embeddings when configured) with lexical fallback, blended with marketplace
          ranking.
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="Search packs — e.g. SEO growth, software factory, finance"
            className="flex-1 min-w-[200px] bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-sm"
          />
          <button
            onClick={() => load()}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm"
          >
            Search
          </button>
          <button
            onClick={() => {
              setQuery("");
              load("");
            }}
            className="px-4 py-2 rounded-xl border border-zinc-600 text-sm"
          >
            Clear
          </button>
        </div>
        {searchMeta && <p className="text-xs text-zinc-500">{searchMeta}</p>}
        {msg && <p className="text-sm text-emerald-400">{msg}</p>}

        <div className="grid gap-4">
          {ranked.map((p, i) => (
            <article
              key={p.id}
              className="p-5 card-glow card-glow--indigo space-y-3 animate-fade-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="font-medium">
                    <span className="text-zinc-500 text-sm mr-2">#{p.rank}</span>
                    {p.name}{" "}
                    <span className="text-xs text-zinc-500">v{p.version}</span>
                    <span className="text-xs text-indigo-300 ml-2">score {p.score}</span>
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1 capitalize">
                    {p.category} · {p.pricing}
                    {p.verified ? " · verified" : ""}
                    {p.metrics.installs > 0 ? ` · ${p.metrics.installs} installs` : ""}
                    {p.metrics.ratingAvg != null
                      ? ` · ★ ${p.metrics.ratingAvg.toFixed(1)}`
                      : ""}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap h-fit">
                  {p.pricing !== "included" && !installedSet.has(p.id) && (
                    <button
                      onClick={() => checkout(p.id)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-amber-700 text-amber-300 h-fit"
                    >
                      Buy
                    </button>
                  )}
                  <button
                    onClick={() => feature(p.id)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-zinc-600 h-fit"
                  >
                    Feature
                  </button>
                  <button
                    onClick={() => rate(p.id, 5)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-zinc-600 h-fit"
                  >
                    ★ 5
                  </button>
                  {installedSet.has(p.id) ? (
                    <button
                      onClick={() => uninstall(p.id)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-zinc-600 h-fit"
                    >
                      Uninstall
                    </button>
                  ) : (
                    <button
                      onClick={() => install(p.id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 h-fit"
                    >
                      Install
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-zinc-300">{p.description}</p>
              <p className="text-xs text-zinc-500">Agents: {p.agents.join(", ")}</p>
              {p.reasons?.length > 0 && (
                <p className="text-[11px] text-zinc-600">Rank reasons: {p.reasons.join(" · ")}</p>
              )}
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
