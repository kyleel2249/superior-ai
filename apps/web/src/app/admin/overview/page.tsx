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
    {
      href: "/admin/capabilities",
      label: "Capabilities & Features",
      description: "Full explanation of everything this platform does, organized by subsystem — what's real, and what's intentionally limited.",
      glow: "card-glow--intense",
    },
    {
      href: "/admin/providers",
      label: "Providers & API Keys",
      description:
        "Add or update provider API keys (OpenAI, Anthropic, xAI, Google, OpenRouter, local) and see live model health.",
      glow: "card-glow--indigo",
    },
    {
      href: "/admin/foundation",
      label: "Platform Foundation",
      description:
        "Live feature flags, config, and the event bus — read directly from the running process, nothing hardcoded.",
      glow: "card-glow--cyan",
    },
    {
      href: "/admin/health",
      label: "System Health",
      description:
        "Real component status (API, database, redis, AI gateway, auth) plus an on-demand self-test suite.",
      glow: "card-glow--emerald",
    },
    {
      href: "/admin/queue",
      label: "Job Queue",
      description:
        "Live view of the background job queue — enqueue real jobs and watch priority, retries, and failures happen live.",
      glow: "card-glow--amber",
    },
    {
      href: "/admin/sales",
      label: "Sales Pipeline",
      description:
        "Create and qualify real leads through the actual scoring engine (fit ≥ 50 and intent ≥ 40 to qualify).",
      glow: "card-glow--fuchsia",
    },
    {
      href: "/admin/growth",
      label: "Growth Experiments",
      description: "Generate real A/B experiment proposals from the growth engine, with growth-stage context.",
      glow: "card-glow--indigo",
    },
    {
      href: "/admin/search",
      label: "Search Engines",
      description: "Live registry of every search engine integration and its real configured/not-configured status; run a real search.",
      glow: "card-glow--emerald",
    },
    {
      href: "/admin/pnl",
      label: "AI Workforce P&L",
      description: "Real cost/labor-value rollup from recorded task economics, broken down by department. Illustrative, not audited financials.",
      glow: "card-glow--amber",
    },
    {
      href: "/admin/support",
      label: "Support Tickets",
      description: "Submit a real ticket and watch sentiment detection and role routing happen live — angry/urgent tickets auto-escalate.",
      glow: "card-glow--fuchsia",
    },
    {
      href: "/admin/voc",
      label: "Voice of Customer",
      description: "Real theme detection from pasted feedback. NPS/CSAT always stay null until real survey data exists — never estimated.",
      glow: "card-glow--cyan",
    },
    {
      href: "/admin/compliance",
      label: "Compliance Readiness",
      description:
        "SOC 2 evidence-pack completion tracker — measures template progress, never claims certification.",
      glow: "card-glow--cyan",
    },
    {
      href: "/admin/audit",
      label: "Audit Log",
      description: "Real security event stream — logins, config changes, privileged actions. Requires auth in production.",
      glow: "card-glow--indigo",
    },
    {
      href: "/admin/packs",
      label: "Agent packs",
      description: "Manage installed agent packs and their capabilities.",
      glow: "card-glow--emerald",
    },
    {
      href: "/settings/billing",
      label: "Billing",
      description: "Subscription plan, invoices, and payment method.",
      glow: "card-glow--amber",
    },
    {
      href: "/settings/costs",
      label: "Costs",
      description: "Usage-based cost breakdown by meter and budget alerts.",
      glow: "card-glow--fuchsia",
    },
    {
      href: "/status",
      label: "Public status",
      description: "The externally-visible status page shown to customers.",
      glow: "card-glow--indigo",
    },
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
        <nav className="grid sm:grid-cols-2 gap-3">
          {links.map((l, i) => (
            <Link
              key={l.href}
              href={l.href}
              className={`card-glow ${l.glow} rounded-xl p-4 block animate-fade-up hover:brightness-110 transition`}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="text-sm font-semibold text-white">{l.label}</div>
              <div className="text-xs text-zinc-400 mt-1 leading-relaxed">{l.description}</div>
            </Link>
          ))}
        </nav>

        <div className="grid md:grid-cols-2 gap-4">
          <section className="p-4 card-glow animate-fade-up" style={{ animationDelay: "0ms" }}>
            <h2 className="text-sm font-medium text-zinc-400 mb-2">Health</h2>
            <pre className="text-[11px] text-zinc-400 overflow-auto max-h-48">
              {JSON.stringify(health, null, 2)}
            </pre>
          </section>
          <section className="p-4 card-glow animate-fade-up" style={{ animationDelay: "60ms" }}>
            <h2 className="text-sm font-medium text-zinc-400 mb-2">Status</h2>
            <pre className="text-[11px] text-zinc-400 overflow-auto max-h-48">
              {JSON.stringify(status, null, 2)}
            </pre>
          </section>
          <section className="p-4 card-glow animate-fade-up" style={{ animationDelay: "120ms" }}>
            <h2 className="text-sm font-medium text-zinc-400 mb-2">Metrics</h2>
            <pre className="text-[11px] text-zinc-400 overflow-auto max-h-48">
              {JSON.stringify(metrics, null, 2)}
            </pre>
          </section>
          <section className="p-4 card-glow animate-fade-up" style={{ animationDelay: "180ms" }}>
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
