"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ModelRow = {
  id: string;
  provider: string;
  modelId: string;
  displayName: string;
  status: string;
  availability: boolean;
  healthScore: number;
  priority: number;
  aliases?: string[];
};

type HealthRow = {
  provider: string;
  status: string;
  healthScore: number;
  latencyMs?: number;
  message?: string;
  checkedAt: string;
};

const STATUS_COLOR: Record<string, string> = {
  AVAILABLE: "text-emerald-400",
  REGISTERED: "text-zinc-400",
  CONFIGURATION_REQUIRED: "text-amber-400",
  UNAVAILABLE: "text-zinc-500",
  DEPRECATED: "text-orange-400",
  HEALTH_CHECK_FAILED: "text-red-400",
};

export default function ProvidersAdminPage() {
  const [models, setModels] = useState<ModelRow[]>([]);
  const [health, setHealth] = useState<HealthRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthMsg, setHealthMsg] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [m, h] = await Promise.all([
        fetch("/api/models").then((r) => r.json()),
        fetch("/api/health").then((r) => r.json()),
      ]);
      setModels(m.models ?? []);
      setHealth(h.providers ?? []);
      setHealthMsg(h.message ?? "");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const byProvider = models.reduce<Record<string, ModelRow[]>>((acc, m) => {
    (acc[m.provider] ??= []).push(m);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--card-border)] bg-[var(--card)] px-6 h-14 flex items-center gap-4">
        <Link href="/" className="text-zinc-400 hover:text-white text-sm">← Home</Link>
        <h1 className="font-semibold">Admin · Providers & Health</h1>
        <button onClick={load} className="ml-auto text-sm text-indigo-400 hover:underline">Refresh health</button>
        <Link href="/chat" className="text-sm text-indigo-400 hover:underline">Command Center</Link>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-6 p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 text-sm text-indigo-100/90">
          {healthMsg || "Continuous AI capacity is active."}
        </div>

        <h2 className="text-lg font-semibold mb-3">Provider health</h2>
        <div className="grid md:grid-cols-3 gap-3 mb-10">
          {loading && !health.length ? (
            <p className="text-zinc-500">Checking…</p>
          ) : (
            health.map((h) => (
              <div key={h.provider} className="p-4 rounded-xl bg-[var(--card)] border border-[var(--card-border)]">
                <div className="flex justify-between items-center">
                  <span className="font-medium uppercase text-sm">{h.provider}</span>
                  <span className={`text-xs ${STATUS_COLOR[h.status] ?? "text-zinc-400"}`}>{h.status}</span>
                </div>
                <div className="text-xs text-zinc-500 mt-2">
                  Health {h.healthScore}
                  {h.latencyMs != null ? ` · ${h.latencyMs}ms` : ""}
                </div>
                {h.message && <div className="text-xs text-zinc-500 mt-1 truncate">{h.message}</div>}
              </div>
            ))
          )}
        </div>

        <div className="mb-8 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 text-sm text-amber-200/90">
          <strong>Integration rule:</strong> Models are only AVAILABLE after credential + endpoint validation.
          Future names (GPT-6, GPT-7, …) stay UNAVAILABLE until real endpoints exist.
        </div>

        {Object.entries(byProvider).map(([provider, list]) => (
          <section key={provider} className="mb-10">
            <h2 className="text-lg font-semibold capitalize mb-3">{provider} <span className="text-xs font-normal text-zinc-500">{list.length}</span></h2>
            <div className="overflow-x-auto rounded-xl border border-[var(--card-border)]">
              <table className="w-full text-sm">
                <thead className="bg-zinc-900/80 text-zinc-400 text-left">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Model ID</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Health</th>
                    <th className="px-4 py-3">Aliases</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((m) => (
                    <tr key={m.id} className="border-t border-[var(--card-border)]">
                      <td className="px-4 py-3 font-medium">{m.displayName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-400">{m.modelId}</td>
                      <td className={`px-4 py-3 ${STATUS_COLOR[m.status] ?? ""}`}>{m.status}</td>
                      <td className="px-4 py-3">{m.healthScore}</td>
                      <td className="px-4 py-3 text-xs text-zinc-500">{(m.aliases ?? []).join(", ") || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
