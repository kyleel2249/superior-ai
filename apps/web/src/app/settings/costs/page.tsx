"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Report {
  totalCostUsd: number;
  byMeter: Array<{ key: string; costUsd: number; quantity: number; share: number }>;
  byModel: Array<{ key: string; costUsd: number; share: number }>;
  byProvider: Array<{ key: string; costUsd: number; share: number }>;
  byProject: Array<{ projectId: string; costUsd: number; share: number }>;
  byUser: Array<{ userId: string; costUsd: number; share: number }>;
}

export default function CostsPage() {
  const [orgId, setOrgId] = useState("org_dev");
  const [report, setReport] = useState<Report | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/billing?organizationId=${encodeURIComponent(orgId)}&attribution=1`);
    const data = await res.json();
    setReport(data.attribution ?? null);
  }

  useEffect(() => {
    load().catch((e) => setMsg(String(e)));
  }, []);

  async function seedDemo() {
    setMsg(null);
    await fetch("/api/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "record",
        organizationId: orgId,
        meter: "tokens",
        quantity: 12000,
        costUsd: 0.08,
        modelId: "gpt-5.6-luna",
        provider: "openai",
      }),
    });
    await fetch("/api/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "attribute_model",
        organizationId: orgId,
        projectId: "proj_growth",
        userId: "user_dev_admin",
        modelId: "claude-opus-5",
        provider: "anthropic",
        costUsd: 0.42,
        tokens: 8000,
      }),
    });
    await load();
    setMsg("Demo usage recorded");
  }

  function pct(n: number) {
    return `${(n * 100).toFixed(1)}%`;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-white">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-sm text-zinc-400 hover:text-white">
          SUPERIOR AI
        </Link>
        <span className="text-zinc-600">/</span>
        <Link href="/settings/billing" className="text-sm text-zinc-400 hover:text-white">
          Billing
        </Link>
        <span className="text-zinc-600">/</span>
        <h1 className="font-medium">Cost attribution</h1>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-zinc-500">Organization</label>
            <input
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              className="block mt-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={() => load()}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm"
          >
            Refresh
          </button>
          <button
            onClick={seedDemo}
            className="px-4 py-2 rounded-xl border border-zinc-600 text-sm hover:border-zinc-400"
          >
            Seed demo costs
          </button>
        </div>

        {msg && <p className="text-sm text-emerald-400">{msg}</p>}

        {report && (
          <>
            <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--card-border)]">
              <p className="text-xs text-zinc-500">Total attributed (in-process)</p>
              <p className="text-3xl font-semibold mt-1">${report.totalCostUsd.toFixed(4)}</p>
              <p className="text-xs text-zinc-500 mt-2">
                Estimates and recorded meters — not a tax invoice.
              </p>
            </div>

            {(
              [
                ["By meter", report.byMeter.map((r) => [r.key, r.costUsd, r.share] as const)],
                ["By model", report.byModel.map((r) => [r.key, r.costUsd, r.share] as const)],
                ["By provider", report.byProvider.map((r) => [r.key, r.costUsd, r.share] as const)],
                [
                  "By project",
                  report.byProject.map((r) => [r.projectId, r.costUsd, r.share] as const),
                ],
                ["By user", report.byUser.map((r) => [r.userId, r.costUsd, r.share] as const)],
              ] as const
            ).map(([title, rows]) => (
              <section key={title} className="space-y-2">
                <h2 className="text-sm font-medium text-zinc-400">{title}</h2>
                {rows.length === 0 ? (
                  <p className="text-xs text-zinc-600">No data yet</p>
                ) : (
                  <ul className="rounded-xl border border-zinc-800 divide-y divide-zinc-800">
                    {rows.map(([k, cost, share]) => (
                      <li key={String(k)} className="flex justify-between px-4 py-2 text-sm">
                        <span className="text-zinc-300 truncate mr-4">{k}</span>
                        <span className="text-zinc-400 tabular-nums">
                          ${Number(cost).toFixed(4)} · {pct(Number(share))}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </>
        )}
      </main>
    </div>
  );
}
