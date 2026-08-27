"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface Dept {
  id: string;
  name: string;
  objectives: string[];
  kpis: string[];
  agentCount: number;
  agents: string[];
}

interface CompanyResult {
  mode?: string;
  objective?: string;
  orgChartPreview?: string;
  executiveSynthesis?: string;
  contributions?: Array<{
    departmentName: string;
    recommendation: string;
    risks: string[];
    expectedOutcome: string;
  }>;
  error?: string;
}

interface DailyBrief {
  title: string;
  focusToday: string[];
  sections: Array<{ id: string; title: string; items: string[] }>;
  disclaimer: string;
}

const LINKS = [
  { href: "/chat", label: "Chat" },
  { href: "/daily", label: "Daily Intel" },
  { href: "/dashboard", label: "KPIs" },
  { href: "/sales", label: "Sales" },
  { href: "/marketing", label: "Marketing" },
  { href: "/seo", label: "SEO" },
  { href: "/competitors", label: "Competitors" },
  { href: "/studio", label: "Studio" },
  { href: "/workspace", label: "Workspace" },
  { href: "/status", label: "Status" },
  { href: "/ceo", label: "CEO desk" },
];

export default function CommandCenterPage() {
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [orgChart, setOrgChart] = useState<string>("");
  const [objective, setObjective] = useState("Launch growth campaign and improve conversion");
  const [company, setCompany] = useState<CompanyResult | null>(null);
  const [brief, setBrief] = useState<DailyBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/company")
      .then((r) => r.json())
      .then((d) => {
        setDepartments(d.departments ?? []);
        setOrgChart(typeof d.orgChart === "string" ? d.orgChart : JSON.stringify(d.orgChart ?? "", null, 2));
      })
      .catch((e) => setError(String(e)));
  }, []);

  const runCompany = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cRes, dRes] = await Promise.all([
        fetch("/api/company", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "run", objective, product: "SUPERIOR AI" }),
        }),
        fetch("/api/daily", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ objective, product: "SUPERIOR AI", includeMemory: true }),
        }),
      ]);
      const cData = await cRes.json();
      const dData = await dRes.json();
      if (!cRes.ok) throw new Error(cData.error || "Company run failed");
      setCompany(cData);
      if (dRes.ok) setBrief(dData);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [objective]);

  return (
    <div className="min-h-screen bg-[var(--background)] text-zinc-100">
      <header className="border-b border-[var(--card-border)] bg-[var(--card)]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-zinc-400 hover:text-white">
              ← Home
            </Link>
            <h1 className="font-semibold tracking-tight">AI Company Command Center</h1>
          </div>
          <div className="hidden md:flex flex-wrap gap-2 justify-end">
            {LINKS.slice(0, 6).map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-xs px-2 py-1 rounded border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {error && (
          <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <section className="card-glow p-6 animate-fade-up">
          <h2 className="text-sm font-medium text-zinc-300 mb-3">Run as a company</h2>
          <div className="flex flex-col md:flex-row gap-3">
            <input
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              placeholder="Company objective"
            />
            <button
              type="button"
              onClick={runCompany}
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? "Running departments…" : "Engage departments"}
            </button>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Orchestrates multi-department contributions + daily intelligence. No fabricated metrics or contacts.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-medium text-zinc-400 mb-3">Departments</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {departments.map((d, i) => (
              <div
                key={d.id}
                className="card-glow card-glow--indigo p-4 animate-fade-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">{d.name}</h3>
                  <span className="text-[10px] uppercase tracking-wide text-zinc-500">
                    {d.agentCount} agents
                  </span>
                </div>
                <p className="mt-2 text-xs text-zinc-500 line-clamp-2">
                  {d.objectives?.slice(0, 2).join(" · ") || "—"}
                </p>
                <p className="mt-2 text-[11px] text-zinc-600">
                  KPIs: {(d.kpis ?? []).slice(0, 3).join(", ") || "—"}
                </p>
              </div>
            ))}
          </div>
        </section>

        {company && (
          <section className="grid lg:grid-cols-2 gap-6">
            <div className="card-glow card-glow--indigo p-6 animate-fade-up">
              <h2 className="text-sm font-medium text-indigo-200">Executive synthesis</h2>
              <p className="mt-3 text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {company.executiveSynthesis || "—"}
              </p>
            </div>
            <div className="card-glow card-glow--cyan p-6 animate-fade-up" style={{animationDelay: "80ms"}}>
              <h2 className="text-sm font-medium text-zinc-300">Department contributions</h2>
              <ul className="mt-3 space-y-3 max-h-80 overflow-y-auto">
                {(company.contributions ?? []).map((c, i) => (
                  <li key={i} className="text-sm border-b border-zinc-800 pb-3">
                    <div className="font-medium text-zinc-200">{c.departmentName}</div>
                    <div className="text-zinc-400 mt-1">{c.recommendation}</div>
                    {c.risks?.length > 0 && (
                      <div className="text-xs text-amber-200/80 mt-1">Risks: {c.risks.join("; ")}</div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {brief && (
          <section className="card-glow card-glow--amber p-6 animate-fade-up">
            <h2 className="text-sm font-medium text-zinc-300">{brief.title}</h2>
            <ul className="mt-3 space-y-1">
              {brief.focusToday.map((f, i) => (
                <li key={i} className="text-sm text-zinc-400">
                  · {f}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-zinc-600">{brief.disclaimer}</p>
          </section>
        )}

        <section className="grid md:grid-cols-2 gap-6">
          <div className="card-glow p-5 animate-fade-up">
            <h2 className="text-sm font-medium text-zinc-400 mb-3">Quick links</h2>
            <div className="flex flex-wrap gap-2">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-xs px-3 py-1.5 rounded-full border border-zinc-700 text-zinc-300 hover:border-indigo-500 hover:text-white"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="card-glow p-5 animate-fade-up" style={{animationDelay: "80ms"}}>
            <h2 className="text-sm font-medium text-zinc-400 mb-3">Org chart preview</h2>
            <pre className="text-[11px] text-zinc-500 whitespace-pre-wrap max-h-48 overflow-y-auto font-mono">
              {orgChart || "Loading…"}
            </pre>
          </div>
        </section>
      </main>
    </div>
  );
}
