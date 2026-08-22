"use client";
import Link from "next/link";
import { useState } from "react";

export default function CompetitorWarRoom() {
  const [msg, setMsg] = useState("Analyze my top competitors and how they acquire customers.");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, intelligenceLevel: "DEEP" }),
      });
      const data = await res.json();
      setResult(data.reply ?? data.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--card-border)] bg-[var(--card)] px-6 h-14 flex items-center gap-4">
        <Link href="/" className="text-zinc-400 hover:text-white text-sm">← Home</Link>
        <h1 className="font-semibold">Competitor War Room</h1>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        <p className="text-zinc-400 text-sm">
          Public-data competitor research · Traffic shells with provenance · SEO/content/offer gaps. No fabricated metrics.
        </p>
        <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={3} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm" />
        <button onClick={run} disabled={loading} className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40">
          {loading ? "…" : "Run competitor intelligence"}
        </button>
        {result && <pre className="whitespace-pre-wrap text-sm bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">{result}</pre>}
      </main>
    </div>
  );
}
