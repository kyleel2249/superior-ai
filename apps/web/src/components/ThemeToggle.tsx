"use client";

import { useEffect, useState } from "react";

const THEMES = [
  { id: "dark", label: "Dark" },
  { id: "midnight", label: "Midnight" },
  { id: "aurora", label: "Aurora" },
  { id: "light", label: "Light" },
] as const;

type ThemeId = (typeof THEMES)[number]["id"];

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<ThemeId>("dark");

  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem("sai-theme")) as ThemeId | null;
    const initial = stored && THEMES.some((t) => t.id === stored) ? stored : "dark";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  function apply(id: ThemeId) {
    setTheme(id);
    document.documentElement.setAttribute("data-theme", id);
    localStorage.setItem("sai-theme", id);
  }

  if (compact) {
    const next = THEMES[(THEMES.findIndex((t) => t.id === theme) + 1) % THEMES.length]!;
    return (
      <button
        type="button"
        className="chip text-[11px]"
        onClick={() => apply(next.id)}
        title={`Theme: ${theme} → ${next.label}`}
      >
        {theme}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label="Theme">
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => apply(t.id)}
          className={`chip text-[10px] ${
            theme === t.id ? "border-indigo-400/60 bg-indigo-500/20 text-white" : ""
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
