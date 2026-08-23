"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ComponentStatus = "operational" | "degraded" | "outage" | "maintenance" | "unknown";

interface StatusPayload {
  overall: ComponentStatus;
  components: Array<{
    id: string;
    name: string;
    status: ComponentStatus;
    description?: string;
    updatedAt: string;
  }>;
  incidents: Array<{
    id: string;
    title: string;
    status: string;
    impact: string;
    body: string;
    createdAt: string;
    updatedAt: string;
  }>;
  checkedAt: string;
}

const color: Record<ComponentStatus, string> = {
  operational: "bg-emerald-500",
  degraded: "bg-amber-500",
  outage: "bg-red-500",
  maintenance: "bg-sky-500",
  unknown: "bg-zinc-500",
};

const label: Record<ComponentStatus, string> = {
  operational: "All systems operational",
  degraded: "Degraded performance",
  outage: "Service outage",
  maintenance: "Maintenance",
  unknown: "Status unknown",
};

export default function StatusPage() {
  const [data, setData] = useState<StatusPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setError(String(e)));
    const t = setInterval(() => {
      fetch("/api/status")
        .then((r) => r.json())
        .then(setData)
        .catch(() => undefined);
    }, 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between max-w-3xl mx-auto">
        <div>
          <Link href="/" className="text-xs text-zinc-500 hover:text-white">
            SUPERIOR AI
          </Link>
          <h1 className="text-xl font-semibold mt-1">System status</h1>
        </div>
        <span className="text-xs text-zinc-500">
          {data?.checkedAt ? new Date(data.checkedAt).toLocaleString() : "…"}
        </span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        {error && <p className="text-red-400 text-sm">{error}</p>}

        {data && (
          <>
            <div className="flex items-center gap-3 p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
              <span className={`w-3 h-3 rounded-full ${color[data.overall]}`} />
              <div>
                <p className="font-medium">{label[data.overall]}</p>
                <p className="text-xs text-zinc-500">Public status · no authentication required</p>
              </div>
            </div>

            <section className="space-y-2">
              <h2 className="text-sm font-medium text-zinc-400">Components</h2>
              <ul className="rounded-2xl border border-zinc-800 divide-y divide-zinc-800 bg-zinc-900/50">
                {data.components.map((c) => (
                  <li key={c.id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <div>
                      <p>{c.name}</p>
                      {c.description && (
                        <p className="text-xs text-zinc-500 mt-0.5">{c.description}</p>
                      )}
                    </div>
                    <span className="flex items-center gap-2 text-xs text-zinc-400 capitalize">
                      <span className={`w-2 h-2 rounded-full ${color[c.status]}`} />
                      {c.status}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-medium text-zinc-400">Incidents</h2>
              {data.incidents.length === 0 ? (
                <p className="text-sm text-zinc-500">No recent incidents.</p>
              ) : (
                <ul className="space-y-3">
                  {data.incidents.map((i) => (
                    <li key={i.id} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
                      <div className="flex justify-between gap-2 text-sm">
                        <p className="font-medium">{i.title}</p>
                        <span className="text-xs text-zinc-500 capitalize">{i.status}</span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-2 whitespace-pre-wrap">{i.body}</p>
                      <p className="text-[10px] text-zinc-600 mt-2">
                        Updated {new Date(i.updatedAt).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
