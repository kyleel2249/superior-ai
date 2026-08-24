"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadLocalPrefs, saveLocalPrefs, type LocalPrefs } from "@/lib/local-prefs";

export default function PreferencesPage() {
  const [prefs, setPrefs] = useState<LocalPrefs | null>(null);
  const [server, setServer] = useState<Record<string, unknown> | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPrefs(loadLocalPrefs());
    fetch("/api/workspace")
      .then((r) => r.json())
      .then((d) => setServer(d.preferences ?? null))
      .catch(() => undefined);
  }, []);

  async function save() {
    if (!prefs) return;
    saveLocalPrefs(prefs);
    await fetch("/api/workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_preferences",
        preferences: {
          theme: prefs.theme,
          language: prefs.language,
          defaultIntelligence: prefs.defaultIntelligence,
          reduceMotion: prefs.reduceMotion,
        },
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!prefs) {
    return (
      <div className="max-w-xl mx-auto px-6 py-10 text-zinc-400 text-sm">Loading preferences…</div>
    );
  }

  return (
    <div className="min-h-screen">
      <main className="max-w-xl mx-auto px-6 py-10 space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Preferences</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Local-first settings. Stored in this browser and synced to the active workspace profile.
            No account required.
          </p>
        </div>

        <label className="block text-sm space-y-1">
          <span className="text-zinc-400">Theme</span>
          <select
            value={prefs.theme}
            onChange={(e) =>
              setPrefs({ ...prefs, theme: e.target.value as LocalPrefs["theme"] })
            }
            className="w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3 py-2"
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="system">System</option>
          </select>
        </label>

        <label className="block text-sm space-y-1">
          <span className="text-zinc-400">Language</span>
          <input
            value={prefs.language}
            onChange={(e) => setPrefs({ ...prefs, language: e.target.value })}
            className="w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3 py-2"
          />
        </label>

        <label className="block text-sm space-y-1">
          <span className="text-zinc-400">Default intelligence</span>
          <select
            value={prefs.defaultIntelligence}
            onChange={(e) => setPrefs({ ...prefs, defaultIntelligence: e.target.value })}
            className="w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3 py-2"
          >
            {["FAST", "BALANCED", "DEEP", "EXPERT", "MAXIMUM", "SUPREME", "AUTONOMOUS"].map(
              (x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              )
            )}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={prefs.reduceMotion}
            onChange={(e) => setPrefs({ ...prefs, reduceMotion: e.target.checked })}
          />
          Reduce motion
        </label>

        <button
          type="button"
          onClick={save}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-medium text-sm"
        >
          Save preferences
        </button>
        {saved && <p className="text-sm text-emerald-400">Saved locally and to workspace.</p>}

        {server && (
          <pre className="text-xs text-zinc-500 bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 overflow-auto">
            Server profile prefs: {JSON.stringify(server, null, 2)}
          </pre>
        )}

        <p className="text-xs text-zinc-600">
          Billing, credits, and token meters are not shown in default local-first mode.{" "}
          <Link href="/workspace" className="text-indigo-400 hover:underline">
            Back to workspace
          </Link>
        </p>
      </main>
    </div>
  );
}
