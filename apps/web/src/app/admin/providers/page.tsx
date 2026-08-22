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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/models")
      .then((r) => r.json())
      .then((d) => setModels(d.models ?? []))
      .finally(() => setLoading(false));
  }, []);

  const byProvider = models.reduce<Record<string, ModelRow[]>>((acc, m) => {
    (acc[m.provider] ??= []).push(m);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--card-border)] bg-[var(--card)] px-6 h-14 flex items-center gap-4">
        <Link href="/" className="text-zinc-400 hover:text-white text-sm">
          ← Home
        </Link>
        <h1 className="font-semibold">Admin · Model Registry</h1>
        <Link href="/chat" className="ml-auto text-sm text-indigo-400 hover:underline">
          Command Center
        </Link>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 text-sm text-amber-200/90">
          <strong>Integration rule:</strong> Models are only marked AVAILABLE after credential + endpoint validation
          succeeds. Future names (GPT-6, GPT-7, etc.) stay UNAVAILABLE and automatically fall back to the best verified
          model. Never fake a connection.
        </div>

        <p className="text-zinc-400 text-sm mb-6">
          Set keys in <code className="text-zinc-300">.env</code> (see <code>.env.example</code>) or via the upcoming
          encrypted key pool UI. Restart / re-request chat after adding keys to trigger health checks.
        </p>

        {loading ? (
          <p className="text-zinc-500">Loading registry…</p>
        ) : (
          Object.entries(byProvider).map(([provider, list]) => (
            <section key={provider} className="mb-10">
              <h2 className="text-lg font-semibold capitalize mb-3 flex items-center gap-2">
                {provider}
                <span className="text-xs font-normal text-zinc-500">{list.length} models</span>
              </h2>
              <div className="overflow-x-auto rounded-xl border border-[var(--card-border)]">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-900/80 text-zinc-400 text-left">
                    <tr>
                      <th className="px-4 py-3">Display Name</th>
                      <th className="px-4 py-3">Model ID</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Health</th>
                      <th className="px-4 py-3">Priority</th>
                      <th className="px-4 py-3">Aliases</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((m) => (
                      <tr key={m.id} className="border-t border-[var(--card-border)] hover:bg-zinc-900/40">
                        <td className="px-4 py-3 font-medium">{m.displayName}</td>
                        <td className="px-4 py-3 font-mono text-xs text-zinc-400">{m.modelId}</td>
                        <td className={`px-4 py-3 ${STATUS_COLOR[m.status] ?? "text-zinc-400"}`}>{m.status}</td>
                        <td className="px-4 py-3">{m.healthScore}</td>
                        <td className="px-4 py-3">{m.priority}</td>
                        <td className="px-4 py-3 text-xs text-zinc-500">{(m.aliases ?? []).join(", ") || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
}
