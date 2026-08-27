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
          {["Revenue", "Pipeline", "Marketing", "Traffic", "Competitors", "Customers", "Finance", "Risks", "Experiments"].map((k, i) => (
            <div key={k} className="p-4 card-glow animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="text-zinc-500 text-xs uppercase">{k}</div>
              <div className="text-zinc-400 mt-1">Connect analytics to populate</div>
            </div>
          ))}
        </div>
        <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={3} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm" />
        <div className="flex items-center gap-3">
          <button onClick={run} disabled={loading} className="btn-rainbow px-6 py-3 rounded-xl disabled:opacity-40">
            {loading ? "…" : "Ask AI CEO"}
          </button>
          {loading && (
            <div className="ai-ring ai-ring--active">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[10px] font-bold">
                S
              </div>
            </div>
          )}
        </div>
        {result && <pre className="whitespace-pre-wrap text-sm card-glow p-6 animate-fade-up">{result}</pre>}
      </main>
    </div>
  );
}
