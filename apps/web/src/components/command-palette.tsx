"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface PaletteItem {
  label: string;
  href: string;
  hint?: string;
}

const ITEMS: PaletteItem[] = [
  { label: "Dashboard", href: "/", hint: "system status & activity" },
  { label: "Workspaces", href: "/workspaces", hint: "create workspaces & projects" },
  { label: "Chat", href: "/chat", hint: "talk to a model" },
  { label: "Orchestrator", href: "/workspace", hint: "plan & run factory tasks" },
  { label: "Studio", href: "/studio", hint: "image & video generation" },
  { label: "Packs", href: "/admin/packs", hint: "install agent packs" },
  { label: "Publisher", href: "/publisher", hint: "revenue & pack publishing" },
  { label: "Status", href: "/status", hint: "public system status" },
];

/**
 * Reads a boolean "kbShortcuts" cookie set by the workspace preferences page
 * (falls back to enabled) so a user who disabled keyboard shortcuts there
 * actually gets that respected here, not just a UI toggle that does nothing.
 */
function shortcutsEnabled(): boolean {
  if (typeof document === "undefined") return true;
  const match = document.cookie.split("; ").find((row) => row.startsWith("kbShortcuts="));
  return match ? match.split("=")[1] !== "false" : true;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const filtered = ITEMS.filter(
    (item) => item.label.toLowerCase().includes(query.toLowerCase()) || item.hint?.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!shortcutsEnabled()) return;
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        setQuery("");
        setActiveIndex(0);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function navigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[activeIndex]) {
      navigate(filtered[activeIndex].href);
    }
  }

  if (!open) return null;

  return (
    <div
      onClick={() => setOpen(false)}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10,12,16,0.6)",
        backdropFilter: "blur(2px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "12vh",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 480,
          maxWidth: "90vw",
          background: "var(--ink-900)",
          border: "1px solid var(--ink-700)",
          borderRadius: 10,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={onInputKeyDown}
          placeholder="Jump to…"
          style={{
            width: "100%",
            padding: "14px 16px",
            background: "transparent",
            border: "none",
            borderBottom: "1px solid var(--ink-700)",
            color: "var(--text-hi)",
            fontSize: 14,
            outline: "none",
          }}
        />
        <div style={{ maxHeight: 320, overflowY: "auto", padding: 6 }}>
          {filtered.length === 0 && <div style={{ padding: "10px 12px", fontSize: 13, color: "var(--text-low)" }}>No matches.</div>}
          {filtered.map((item, i) => (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              onMouseEnter={() => setActiveIndex(i)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
                textAlign: "left",
                padding: "9px 10px",
                borderRadius: 6,
                border: "none",
                background: i === activeIndex ? "var(--ink-800)" : "transparent",
                color: "var(--text-hi)",
                fontSize: 13.5,
                cursor: "pointer",
              }}
            >
              <span>{item.label}</span>
              {item.hint && <span style={{ color: "var(--text-low)", fontSize: 12 }}>{item.hint}</span>}
            </button>
          ))}
        </div>
        <div style={{ padding: "8px 12px", borderTop: "1px solid var(--ink-700)", fontSize: 11, color: "var(--text-low)" }}>
          ↑↓ navigate · ↵ open · esc close
        </div>
      </div>
    </div>
  );
}
