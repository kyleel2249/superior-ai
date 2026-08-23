"use client";
import Link from "next/link";
import { useState } from "react";

export default function MarketingPage() {
  const [product, setProduct] = useState("CRM software");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const res = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objective: `Grow pipeline for ${product} with content, SEO, and campaigns`,
          product,
          audience: "small businesses",
          mode: "execute_safe",
        }),
      });
      const data = await res.json();
      if (data.error) {
        setResult(data.error);
        return;
      }
      const lines = [
        data.summary,
        "",
        "**Stages**",
        ...(data.stages ?? []).map(
          (s: { stage: string; owner: string; status: string; output: string }) =>
            `- [${s.status}] ${s.stage} (${s.owner}): ${s.output}`
        ),
        "",
        `Agents: ${(data.agents ?? []).join(", ")}`,
      ];
      setResult(lines.join("\n"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--card-border)] bg-[var(--card)] px-6 h-14 flex items-center gap-4">
        <Link href="/" className="text-zinc-400 hover:text-white text-sm">← Home</Link>
        <h1 className="font-semibold">Marketing Command Center</h1>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        <p className="text-zinc-400 text-sm">
          Runs the growth orchestrator: campaign, SEO plan, content calendar, experiments, sales draft (approval-gated).
        </p>
        <input
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm"
          placeholder="Product name"
        />
        <button onClick={run} disabled={loading} className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40">
          {loading ? "Orchestrating…" : "Run growth orchestrator"}
        </button>
        {result && <pre className="whitespace-pre-wrap text-sm bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">{result}</pre>}
      </main>
    </div>
  );
}
