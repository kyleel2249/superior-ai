"use client";

import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/chat", label: "Chat" },
  { href: "/workspace", label: "Workspace" },
  { href: "/studio", label: "Studio" },
  { href: "/admin/packs", label: "Packs" },
  { href: "/publisher", label: "Publisher" },
  { href: "/status", label: "Status" },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside
        style={{
          width: 216,
          flexShrink: 0,
          borderRight: "1px solid var(--ink-700)",
          background: "var(--ink-900)",
          padding: "20px 14px",
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 8px 20px" }}>
          <span
            aria-hidden
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: "var(--signal)",
              boxShadow: "0 0 8px var(--signal)",
              display: "inline-block",
            }}
          />
          <span style={{ fontFamily: "var(--mono)", fontSize: 13, letterSpacing: "0.08em", color: "var(--text-hi)" }}>
            SUPERIOR&nbsp;AI
          </span>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                style={{
                  display: "block",
                  padding: "8px 10px",
                  borderRadius: 6,
                  fontSize: 13.5,
                  color: active ? "var(--text-hi)" : "var(--text-mid)",
                  background: active ? "var(--ink-800)" : "transparent",
                  borderLeft: active ? "2px solid var(--signal)" : "2px solid transparent",
                  textDecoration: "none",
                }}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
      </aside>
      <main style={{ flex: 1, minWidth: 0 }}>{children}</main>
    </div>
  );
}
