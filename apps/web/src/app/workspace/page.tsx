"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { saveLocalPrefs, saveLocalProject, loadLocalProjects } from "@/lib/local-prefs";

type Profile = { id: string; name: string; kind: string };
type Project = { id: string; name: string; description?: string; profileId: string; status?: string };

const KINDS = ["personal", "business", "development", "marketing", "research", "creative"] as const;

export default function WorkspacePage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [active, setActive] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [localProjects, setLocalProjects] = useState<Project[]>([]);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileKind, setNewProfileKind] = useState<string>("personal");
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [note, setNote] = useState("");

  async function refresh() {
    const w = await fetch("/api/workspace").then((r) => r.json());
    setProfiles(w.profiles ?? []);
    setActive(w.active ?? null);
    setProjects(w.projects ?? []);
    setLocalProjects(loadLocalProjects());
  }

  useEffect(() => {
    refresh().catch(console.error);
  }, []);

  async function activate(id: string) {
    await fetch("/api/workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "activate", id }),
    });
    saveLocalPrefs({ profileId: id });
    setMsg(`Active profile updated`);
    await refresh();
  }

  async function createProfile() {
    const res = await fetch("/api/workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_profile",
        name: newProfileName || "New profile",
        kind: newProfileKind,
      }),
    });
    const p = await res.json();
    if (p.id) {
      setNewProfileName("");
      setMsg(`Created profile ${p.name}`);
      await refresh();
    }
  }

  async function createProject() {
    if (!projectName.trim()) return;
    const res = await fetch("/api/workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_project",
        name: projectName,
        description: projectDesc,
        profileId: active?.id,
      }),
    });
    const p = await res.json();
    if (p.id) {
      saveLocalProject({
        id: p.id,
        name: p.name,
        description: p.description,
        profileId: p.profileId,
      });
      setProjectName("");
      setProjectDesc("");
      setMsg(`Project “${p.name}” created`);
      await refresh();
    }
  }

  async function rememberPreference() {
    if (!note.trim()) return;
    await fetch("/api/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "remember",
        type: "preference",
        content: note,
        profileId: active?.id,
        importance: 70,
      }),
    });
    setNote("");
    setMsg("Preference stored in memory");
  }

  return (
    <div className="min-h-screen">
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Workspace</h1>
          <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
            Launch → open workspace → use SUPERIOR AI. No sign-in required for the default local
            experience. Optional profiles organize Personal, Business, Development, Marketing,
            Research, and Creative work.
          </p>
        </div>

        {msg && <p className="text-sm text-emerald-400">{msg}</p>}

        <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 space-y-4">
          <h2 className="font-medium">Profiles</h2>
          <p className="text-xs text-zinc-500">
            Active: <strong className="text-zinc-300">{active?.name ?? "—"}</strong>
            {active?.kind ? ` · ${active.kind}` : ""}
          </p>
          <ul className="space-y-2">
            {profiles.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                <span>
                  {p.name}{" "}
                  <span className="text-zinc-500 text-xs">({p.kind})</span>
                </span>
                <button
                  type="button"
                  onClick={() => activate(p.id)}
                  className="text-xs px-2 py-1 rounded-lg border border-zinc-700 hover:border-zinc-500"
                >
                  {active?.id === p.id ? "Active" : "Activate"}
                </button>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2 pt-2">
            <input
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              placeholder="Profile name"
              className="flex-1 min-w-[140px] rounded-xl bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm"
            />
            <select
              value={newProfileKind}
              onChange={(e) => setNewProfileKind(e.target.value)}
              className="rounded-xl bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm"
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={createProfile}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-medium"
            >
              Add profile
            </button>
          </div>
        </section>

        <section
          id="projects"
          className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 space-y-4"
        >
          <h2 className="font-medium">Projects</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Project name"
              className="rounded-xl bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm"
            />
            <input
              value={projectDesc}
              onChange={(e) => setProjectDesc(e.target.value)}
              placeholder="Description (optional)"
              className="rounded-xl bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={createProject}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-medium"
          >
            Create project
          </button>
          <ul className="space-y-2 text-sm">
            {projects.map((p) => (
              <li key={p.id} className="border-b border-zinc-800 pb-2">
                <div className="font-medium">{p.name}</div>
                {p.description && <div className="text-zinc-500 text-xs">{p.description}</div>}
              </li>
            ))}
            {projects.length === 0 && (
              <li className="text-zinc-500 text-xs">No server projects yet for this profile.</li>
            )}
          </ul>
          {localProjects.length > 0 && (
            <div className="text-xs text-zinc-500">
              Browser mirror: {localProjects.map((p) => p.name).join(", ")}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 space-y-3">
          <h2 className="font-medium">Quick preference note</h2>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="e.g. Prefer concise answers and Ghana market context"
            className="w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={rememberPreference}
            className="px-4 py-2 rounded-xl border border-zinc-600 hover:border-zinc-400 text-sm"
          >
            Remember in memory
          </button>
          <p className="text-xs text-zinc-500">
            For theme/language/intelligence defaults see{" "}
            <Link href="/settings/preferences" className="text-indigo-400 hover:underline">
              Preferences
            </Link>
            . Press <kbd className="text-zinc-400">Ctrl/Cmd+K</kbd> for the command palette.
          </p>
        </section>

        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/chat" className="text-indigo-400 hover:underline">
            Open Chat
          </Link>
          <Link href="/settings/preferences" className="text-indigo-400 hover:underline">
            Preferences
          </Link>
          <Link href="/" className="text-zinc-500 hover:text-zinc-300">
            Home
          </Link>
        </div>
      </main>
    </div>
  );
}
