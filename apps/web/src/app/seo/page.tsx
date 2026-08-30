"use client";
import Link from "next/link";
import { useState } from "react";

export default function SeoPage() {
  const [url, setUrl] = useState("https://example.com");
  const [keyword, setKeyword] = useState("crm software");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function audit() {
    setLoading(true);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } finally {
      setLoading(false);
    }
  }

  async function keywords() {
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `SEO keyword research for ${keyword}`, intelligenceLevel: "DEEP" }),
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
        <h1 className="font-semibold">SEO Command Center</h1>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        <div className="space-y-3">
          <label className="text-xs text-zinc-500">URL audit (live fetch)</label>
          <div className="flex gap-2">
            <input value={url} onChange={(e) => setUrl(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm" />
            <button onClick={audit} disabled={loading} className="px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40">Audit</button>
          </div>
        </div>
        <div className="space-y-3">
          <label className="text-xs text-zinc-500">Keyword / content plan</label>
          <div className="flex gap-2">
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm" />
            <button onClick={keywords} disabled={loading} className="px-4 rounded-xl border border-zinc-700 hover:border-zinc-500 disabled:opacity-40">Plan</button>
          </div>
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-sm text-zinc-400 animate-fade-up">
            <div className="ai-ring ai-ring--active">
              <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold">
                S
              </div>
            </div>
            Working…
          </div>
        )}
        {result && <pre className="whitespace-pre-wrap text-sm card-glow p-6 overflow-x-auto animate-fade-up">{result}</pre>}
      </main>
    </div>
  );
}
