"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function WorkspacePage() {
  const [profiles, setProfiles] = useState<Array<{ id: string; name: string; kind: string }>>([]);
  const [active, setActive] = useState<{ id: string; name: string } | null>(null);
  const [memoryStats, setMemoryStats] = useState<Record<string, unknown> | null>(null);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    const [w, m] = await Promise.all([
      fetch("/api/workspace").then((r) => r.json()),
      fetch("/api/memory").then((r) => r.json()),
    ]);
    setProfiles(w.profiles ?? []);
    setActive(w.active ?? null);
    setMemoryStats(m.stats ?? null);
  }

  useEffect(() => {
    refresh().catch(console.error);
  }, []);

  async function remember() {
    if (!note.trim()) return;
    await fetch("/api/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "remember",
        type: "preference",
        content: note,
        profileId: active?.id,
        importance: 70,
      }),
    });
    setNote("");
    setMsg("Remembered");
    await refresh();
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-white">
      <header className="border-b border-zinc-800 px-6 py-4 flex gap-4 items-center flex-wrap">
        <Link href="/" className="text-sm text-zinc-400 hover:text-white">
          SUPERIOR AI
        </Link>
        <span className="text-zinc-600">/</span>
        <h1 className="font-medium">Unlimited Workspace</h1>
        <span className="text-xs text-emerald-400/90 ml-auto">No sign-in required · Local-first</span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <p className="text-sm text-zinc-400">
          Continuous AI sessions with persistent memory. Billing/token meters are not part of the
          primary experience — capacity is handled by routing, queues, and provider failover.
        </p>

        <section className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-3">
          <h2 className="text-sm font-medium text-zinc-300">Active profile</h2>
          <p className="text-lg">{active?.name ?? "…"}</p>
          <div className="flex flex-wrap gap-2">
            {profiles.map((p) => (
              <button
                key={p.id}
                onClick={async () => {
                  await fetch("/api/workspace", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "activate", id: p.id }),
                  });
                  await refresh();
                }}
                className={`text-xs px-3 py-1.5 rounded-full border ${
                  active?.id === p.id ? "border-indigo-500 text-indigo-300" : "border-zinc-700"
                }`}
              >
                {p.name} · {p.kind}
              </button>
            ))}
          </div>
        </section>

        <section className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-3">
          <h2 className="text-sm font-medium text-zinc-300">Remember</h2>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Remember this… (preferences, decisions, rejections)"
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm"
          />
          <button
            onClick={remember}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm"
          >
            Save to memory
          </button>
          {msg && <p className="text-xs text-emerald-400">{msg}</p>}
          {memoryStats && (
            <pre className="text-[11px] text-zinc-500 overflow-auto">
              {JSON.stringify(memoryStats, null, 2)}
            </pre>
          )}
        </section>

        <nav className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          {[
            ["/chat", "Chat"],
            ["/studio", "Creative"],
            ["/ceo", "Council"],
            ["/sales", "Sales"],
            ["/marketing", "Marketing"],
            ["/competitors", "Competitors"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="p-4 rounded-xl border border-zinc-800 hover:border-zinc-600 text-center"
            >
              {label}
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
