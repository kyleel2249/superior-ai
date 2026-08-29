"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CommandPalette } from "./CommandPalette";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/chat", label: "Chat" },
  { href: "/command", label: "Command" },
  { href: "/advanced", label: "Advanced" },
  { href: "/daily", label: "Daily" },
  { href: "/studio", label: "Studio" },
  { href: "/admin/control", label: "Control" },
  { href: "/workspace", label: "Workspace" },
  { href: "/settings/preferences", label: "Settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-indigo-500/20 bg-[#07070f]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="flex items-center gap-2 shrink-0 group"
            >
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-cyan-400 flex items-center justify-center text-xs font-bold shadow-lg shadow-indigo-500/40 animate-pulse-glow group-hover:scale-105 transition-transform">
                S
              </span>
              <span className="font-semibold tracking-tight text-sm text-gradient hidden xs:inline sm:inline">
                SUPERIOR AI
              </span>
            </Link>
            <nav className="hidden lg:flex items-center gap-1 text-xs overflow-x-auto max-w-[50vw]">
              {NAV.map((n) => {
                const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={`px-2.5 py-1.5 rounded-lg transition-all duration-200 ${
                      active
                        ? "bg-gradient-to-r from-indigo-600/80 to-fuchsia-600/80 text-white shadow-md shadow-indigo-500/20"
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {n.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              className="text-[11px] text-zinc-300 border border-indigo-500/30 rounded-lg px-2.5 py-1 hover:border-fuchsia-400/50 hover:bg-indigo-500/10 transition-all hidden sm:inline"
              onClick={() => {
                window.dispatchEvent(
                  new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true })
                );
              }}
              title="Command palette"
            >
              ⌘K
            </button>
            <ThemeToggle compact />
            <Link
              href="/chat"
              className="btn-rainbow text-[11px] px-3 py-1.5 rounded-lg shadow-lg shadow-fuchsia-500/20"
            >
              Launch
            </Link>
          </div>
        </div>
        <nav className="lg:hidden flex gap-1.5 px-3 pb-2.5 overflow-x-auto text-xs scrollbar-none">
          {NAV.map((n) => {
            const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-all ${
                  active
                    ? "bg-indigo-600 text-white"
                    : "text-zinc-400 bg-white/5 hover:text-white"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <CommandPalette />
      <div className="relative z-10 animate-fade-up">{children}</div>
    </>
  );
}
