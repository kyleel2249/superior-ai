"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function AdminOverviewPage() {
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [metrics, setMetrics] = useState<Record<string, unknown> | null>(null);
  const [status, setStatus] = useState<Record<string, unknown> | null>(null);
  const [audit, setAudit] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/health").then((r) => r.json()),
      fetch("/api/metrics").then((r) => r.json()),
      fetch("/api/status").then((r) => r.json()),
      fetch("/api/audit?limit=10").then((r) => r.json()),
    ]).then(([h, m, s, a]) => {
      setHealth(h);
      setMetrics(m);
      setStatus(s);
      setAudit(a);
    });
  }, []);

  const links = [
    { href: "/admin/providers", label: "Providers" },
    { href: "/admin/packs", label: "Agent packs" },
    { href: "/settings/billing", label: "Billing" },
    { href: "/settings/costs", label: "Costs" },
    { href: "/status", label: "Public status" },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-white">
      <header className="border-b border-zinc-800 px-6 py-4 flex gap-4 items-center">
        <Link href="/" className="text-sm text-zinc-400 hover:text-white">
          SUPERIOR AI
        </Link>
        <span className="text-zinc-600">/</span>
        <h1 className="font-medium">Admin overview</h1>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <nav className="flex flex-wrap gap-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-xs px-3 py-1.5 rounded-full border border-zinc-700 hover:border-zinc-500"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="grid md:grid-cols-2 gap-4">
          <section className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40">
            <h2 className="text-sm font-medium text-zinc-400 mb-2">Health</h2>
            <pre className="text-[11px] text-zinc-400 overflow-auto max-h-48">
              {JSON.stringify(health, null, 2)}
            </pre>
          </section>
          <section className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40">
            <h2 className="text-sm font-medium text-zinc-400 mb-2">Status</h2>
            <pre className="text-[11px] text-zinc-400 overflow-auto max-h-48">
              {JSON.stringify(status, null, 2)}
            </pre>
          </section>
          <section className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40">
            <h2 className="text-sm font-medium text-zinc-400 mb-2">Metrics</h2>
            <pre className="text-[11px] text-zinc-400 overflow-auto max-h-48">
              {JSON.stringify(metrics, null, 2)}
            </pre>
          </section>
          <section className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40">
            <h2 className="text-sm font-medium text-zinc-400 mb-2">Recent audit</h2>
            <pre className="text-[11px] text-zinc-400 overflow-auto max-h-48">
              {JSON.stringify(audit, null, 2)}
            </pre>
          </section>
        </div>
      </main>
    </div>
  );
}
