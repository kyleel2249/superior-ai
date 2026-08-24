"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CommandPalette } from "./CommandPalette";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/chat", label: "Chat" },
  { href: "/workspace", label: "Workspace" },
  { href: "/studio", label: "Studio" },
  { href: "/brand", label: "Brand" },
  { href: "/competitors", label: "War Room" },
  { href: "/settings/preferences", label: "Settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--card-border)] bg-[var(--background)]/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center gap-3 justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/" className="font-semibold tracking-tight text-sm shrink-0">
              SUPERIOR AI
            </Link>
            <nav className="hidden md:flex items-center gap-1 text-xs overflow-x-auto">
              {NAV.map((n) => {
                const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={`px-2.5 py-1 rounded-lg ${
                      active
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
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
              className="text-[11px] text-zinc-500 border border-zinc-700 rounded-lg px-2 py-1 hover:border-zinc-500 hidden sm:inline"
              onClick={() => {
                window.dispatchEvent(
                  new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true })
                );
              }}
              title="Command palette"
            >
              ⌘K
            </button>
            <span className="text-[10px] text-zinc-600 hidden lg:inline">Local-first</span>
          </div>
        </div>
        {/* Mobile nav */}
        <nav className="md:hidden flex gap-1 px-3 pb-2 overflow-x-auto text-xs">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="px-2 py-1 rounded-lg text-zinc-400 hover:text-white whitespace-nowrap"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <CommandPalette />
      {children}
    </>
  );
}
