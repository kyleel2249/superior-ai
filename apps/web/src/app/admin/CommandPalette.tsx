"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface CommandEntry {
  label: string;
  description: string;
  href: string;
  keywords: string;
}

const COMMANDS: CommandEntry[] = [
  { label: "Overview", description: "Feature index for the whole admin area", href: "/admin/overview", keywords: "home index overview" },
  { label: "Providers & API Keys", description: "Add provider API keys, view model health", href: "/admin/providers", keywords: "openai anthropic keys models providers" },
  { label: "Platform Foundation", description: "Feature flags, config, event bus, cache", href: "/admin/foundation", keywords: "flags config events cache" },
  { label: "System Health", description: "Component status and self-test suite", href: "/admin/health", keywords: "status uptime self-test" },
  { label: "Job Queue", description: "Live background job monitor", href: "/admin/queue", keywords: "jobs worker retry priority" },
  { label: "Sales Pipeline", description: "Lead scoring and qualification", href: "/admin/sales", keywords: "leads deals crm funnel" },
  { label: "Growth Experiments", description: "A/B experiment proposals", href: "/admin/growth", keywords: "experiments ab testing growth" },
  { label: "Search Engines", description: "Engine registry and live search", href: "/admin/search", keywords: "search engines google ddg" },
  { label: "AI Workforce P&L", description: "Cost vs labor-value rollup", href: "/admin/pnl", keywords: "economics cost revenue finance" },
  { label: "Support Tickets", description: "Sentiment routing and escalation", href: "/admin/support", keywords: "tickets helpdesk sentiment" },
  { label: "Voice of Customer", description: "Feedback theme detection", href: "/admin/voc", keywords: "feedback nps csat themes" },
  { label: "Compliance Readiness", description: "SOC2 evidence-pack tracker", href: "/admin/compliance", keywords: "soc2 audit evidence security" },
  { label: "Audit Log", description: "Security event stream", href: "/admin/audit", keywords: "audit security log events" },
  { label: "Agent packs", description: "Installed agent capabilities", href: "/admin/packs", keywords: "packs agents plugins" },
  { label: "Capabilities & Features", description: "Full explanation of everything the platform does", href: "/admin/capabilities", keywords: "capabilities features docs help explain" },
];

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get_preferences" }),
    })
      .then((r) => r.json())
      .then((p) => setEnabled(p?.commandPaletteEnabled !== false))
      .catch(() => setEnabled(true));
  }, []);

  const results = query.trim()
    ? COMMANDS.filter((c) =>
        `${c.label} ${c.keywords}`.toLowerCase().includes(query.trim().toLowerCase())
      )
    : COMMANDS;

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router]
  );

  useEffect(() => {
    if (!enabled) return;
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);

  useEffect(() => {
    if (open) {
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!enabled || !open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm animate-fade-up"
      onClick={() => setOpen(false)}
    >
      <div
        className="card-glow card-glow--intense rounded-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIndex((i) => Math.min(i + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && results[activeIndex]) {
              go(results[activeIndex]!.href);
            }
          }}
          placeholder="Jump to a feature…"
          className="w-full bg-transparent px-5 py-4 text-white placeholder:text-zinc-500 focus:outline-none border-b border-white/10"
        />
        <div className="max-h-80 overflow-y-auto py-2">
          {results.map((c, i) => (
            <button
              key={c.href}
              onClick={() => go(c.href)}
              onMouseEnter={() => setActiveIndex(i)}
              className="w-full text-left px-5 py-2.5 flex flex-col"
              style={{ background: i === activeIndex ? "rgba(99,102,241,0.15)" : "transparent" }}
            >
              <span className="text-sm text-white">{c.label}</span>
              <span className="text-xs text-zinc-500">{c.description}</span>
            </button>
          ))}
          {results.length === 0 && (
            <div className="px-5 py-6 text-sm text-zinc-500 text-center">No matches.</div>
          )}
        </div>
        <div className="px-5 py-2 border-t border-white/10 text-[11px] text-zinc-600 flex gap-3">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
