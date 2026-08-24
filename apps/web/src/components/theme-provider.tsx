"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "dark" | "light" | "system";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: "dark", setTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

function readCookie(name: string): string | null {
  const match = document.cookie.split("; ").find((row) => row.startsWith(name + "="));
  if (!match) return null;
  const value = match.split("=")[1];
  return value ? decodeURIComponent(value) : null;
}

function applyTheme(theme: Theme) {
  const resolved = theme === "system" ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark") : theme;
  document.documentElement.setAttribute("data-theme", resolved);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const stored = (readCookie("theme") as Theme | null) ?? "dark";
    setThemeState(stored);
    applyTheme(stored);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    applyTheme(t);
    document.cookie = `theme=${encodeURIComponent(t)}; path=/; max-age=31536000`;
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
