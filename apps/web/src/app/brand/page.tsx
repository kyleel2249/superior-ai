"use client";

import { useState } from "react";
import Link from "next/link";

interface Concept {
  id: string;
  name: string;
  style: string;
  description: string;
  svg: string;
  colors: { primary: string; secondary: string; accent: string };
}

export default function BrandStudioPage() {
  const [letters, setLetters] = useState("SA");
  const [name, setName] = useState("SUPERIOR AI");
  const [loading, setLoading] = useState(false);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initials: letters, brandName: name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Brand generation failed");
      const raw = data.concepts || [];
      setConcepts(
        raw.map((c: Record<string, unknown>, i: number) => ({
          id: String(c.id ?? i),
          name: String(c.name ?? c.style ?? `Concept ${i + 1}`),
          style: String(c.style ?? ""),
          description: String(c.description ?? c.rationale ?? ""),
          svg: String(c.svgMark ?? c.svg ?? ""),
          colors: (c.colors as Concept["colors"]) || {
            primary: "#c5cdd8",
            secondary: "#121214",
            accent: "#6366f1",
          },
        }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-zinc-100">
      <header className="border-b border-[var(--card-border)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-200">
            ← Home
          </Link>
          <h1 className="text-lg font-semibold tracking-tight">Brand Studio</h1>
        </div>
        <Link href="/chat" className="text-sm text-indigo-400 hover:text-indigo-300">
          Chat
        </Link>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 space-y-4">
          <p className="text-sm text-zinc-400 leading-relaxed">
            Geometric letterform laboratory — monograms, negative space, and sleek marks from your
            initials. SVG is generated locally; no fabricated logo URLs.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="text-zinc-400">Letters / monogram</span>
              <input
                value={letters}
                onChange={(e) => setLetters(e.target.value.slice(0, 4).toUpperCase())}
                className="mt-1 w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3 py-2"
                maxLength={4}
              />
            </label>
            <label className="block text-sm">
              <span className="text-zinc-400">Brand name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3 py-2"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={generate}
              disabled={loading || !letters.trim()}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 font-medium"
            >
              {loading ? "Generating…" : "Generate letterform concepts"}
            </button>
            <button
              onClick={async () => {
                setLoading(true);
                setError(null);
                try {
                  const res = await fetch("/api/brand", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ initials: letters, brandName: name, export: "kit" }),
                  });
                  if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || "Export failed");
                  }
                  const blob = await res.blob();
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = `${name.replace(/\s+/g, "-").toLowerCase()}-brand-kit.json`;
                  a.click();
                  URL.revokeObjectURL(a.href);
                } catch (e) {
                  setError(e instanceof Error ? e.message : String(e));
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading || !letters.trim()}
              className="px-5 py-2.5 rounded-xl border border-zinc-600 hover:border-zinc-400 disabled:opacity-50 font-medium"
            >
              Export brand kit
            </button>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </section>

        {concepts.length > 0 && (
          <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {concepts.map((c) => (
              <article
                key={c.id || c.name}
                className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5 space-y-3"
              >
                <div
                  className="aspect-square rounded-xl flex items-center justify-center bg-zinc-950 border border-zinc-800"
                  dangerouslySetInnerHTML={{ __html: c.svg }}
                />
                <h3 className="font-medium">{c.name || c.style}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{c.description}</p>
                {c.colors && (
                  <div className="flex gap-2">
                    {Object.values(c.colors).map((hex) => (
                      <span
                        key={hex}
                        title={hex}
                        className="w-6 h-6 rounded-full border border-zinc-600"
                        style={{ background: hex }}
                      />
                    ))}
                  </div>
                )}
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
