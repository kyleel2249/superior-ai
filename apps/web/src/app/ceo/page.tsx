"use client";
import Link from "next/link";
import { useState } from "react";

export default function CeoCommandCenter() {
  const [msg, setMsg] = useState("Run as a company — show departments and daily executive briefing structure.");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, intelligenceLevel: "MAXIMUM" }),
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
        <h1 className="font-semibold">AI CEO Command Center</h1>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          {["Revenue", "Pipeline", "Marketing", "Traffic", "Competitors", "Customers", "Finance", "Risks", "Experiments"].map((k) => (
            <div key={k} className="p-4 rounded-xl bg-[var(--card)] border border-[var(--card-border)]">
              <div className="text-zinc-500 text-xs uppercase">{k}</div>
              <div className="text-zinc-400 mt-1">Connect analytics to populate</div>
            </div>
          ))}
        </div>
        <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={3} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm" />
        <button onClick={run} disabled={loading} className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40">
          {loading ? "…" : "Ask AI CEO"}
        </button>
        {result && <pre className="whitespace-pre-wrap text-sm bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">{result}</pre>}
      </main>
    </div>
  );
}
