"use client";
import Link from "next/link";
import { useState } from "react";

export default function CreativeStudioPage() {
  const [brief, setBrief] = useState("Create a 30-second UGC ad for my CRM software targeting small businesses in Ghana.");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: brief, intelligenceLevel: "EXPERT" }),
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
        <h1 className="font-semibold">Creative Command Center</h1>
        <Link href="/chat" className="ml-auto text-sm text-indigo-400">Chat</Link>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        <p className="text-zinc-400 text-sm">
          Media Studio · UGC Factory · Story Director · Multi-platform variants · Performance prediction (estimates only).
          Native vs upscaled resolution is labeled honestly when image providers are connected.
        </p>
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          rows={4}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm"
        />
        <button
          onClick={run}
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 font-medium"
        >
          {loading ? "Council working…" : "Generate campaign package"}
        </button>
        {result && (
          <pre className="whitespace-pre-wrap text-sm bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 leading-relaxed">
            {result}
          </pre>
        )}
      </main>
    </div>
  );
}
