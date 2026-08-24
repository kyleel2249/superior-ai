"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Cmd = { id: string; label: string; href?: string; hint?: string; run?: () => void };

const COMMANDS: Cmd[] = [
  { id: "home", label: "Home", href: "/", hint: "G" },
  { id: "chat", label: "Chat / Command Center", href: "/chat", hint: "C" },
  { id: "workspace", label: "Workspace", href: "/workspace", hint: "W" },
  { id: "projects", label: "Projects (Workspace)", href: "/workspace#projects" },
  { id: "prefs", label: "Preferences", href: "/settings/preferences" },
  { id: "studio", label: "Creative Studio", href: "/studio" },
  { id: "brand", label: "Brand Studio", href: "/brand" },
  { id: "research", label: "Research (Chat deep)", href: "/chat" },
  { id: "competitors", label: "Competitor War Room", href: "/competitors" },
  { id: "sales", label: "Sales", href: "/sales" },
  { id: "marketing", label: "Marketing", href: "/marketing" },
  { id: "seo", label: "SEO", href: "/seo" },
  { id: "ceo", label: "CEO Center", href: "/ceo" },
  { id: "status", label: "System Status", href: "/status" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return COMMANDS;
    return COMMANDS.filter(
      (c) => c.label.toLowerCase().includes(s) || c.id.includes(s)
    );
  }, [q]);

  const onKey = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      setOpen((v) => !v);
      setQ("");
    }
    if (e.key === "Escape") setOpen(false);
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 pt-[15vh] px-4"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-label="Command palette"
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Jump to… (Ctrl/Cmd+K)"
          className="w-full bg-transparent px-4 py-3 text-sm border-b border-zinc-800 outline-none"
        />
        <ul className="max-h-72 overflow-auto py-2">
          {filtered.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-900 flex justify-between gap-2"
                onClick={() => {
                  setOpen(false);
                  if (c.href) router.push(c.href);
                  c.run?.();
                }}
              >
                <span>{c.label}</span>
                {c.hint && <span className="text-zinc-500 text-xs">{c.hint}</span>}
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-4 py-3 text-sm text-zinc-500">No matches</li>
          )}
        </ul>
        <div className="px-4 py-2 text-[11px] text-zinc-600 border-t border-zinc-800">
          Local-first · No sign-in required · Esc to close
        </div>
      </div>
    </div>
  );
}
