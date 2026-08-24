"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, Badge } from "@/components/ui";

interface Workspace {
  id: string;
  name: string;
  profile: string;
  createdAt: string;
}
interface Project {
  id: string;
  name: string;
  description?: string;
}
interface Preferences {
  theme: string;
  language: string;
  keyboardShortcutsEnabled: boolean;
}

const PROFILES = ["personal", "business", "development", "marketing", "research", "creative"];
const LANGUAGES = ["en", "es", "fr", "de", "pt", "ja", "zh"];

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [newName, setNewName] = useState("");
  const [newProfile, setNewProfile] = useState("personal");
  const [newProjectName, setNewProjectName] = useState("");

  async function refreshWorkspaces() {
    const res = await fetch("/api/workspaces");
    const data = await res.json();
    setWorkspaces(data.workspaces ?? []);
  }

  async function refreshSelected(workspaceId: string) {
    const res = await fetch(`/api/workspaces?workspaceId=${workspaceId}`);
    const data = await res.json();
    setProjects(data.projects ?? []);
    setPrefs(data.preferences ?? null);
  }

  useEffect(() => {
    refreshWorkspaces();
  }, []);

  useEffect(() => {
    if (selected) refreshSelected(selected);
  }, [selected]);

  async function createWorkspace() {
    if (!newName.trim()) return;
    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_workspace", name: newName, profile: newProfile }),
    });
    const ws = await res.json();
    setNewName("");
    await refreshWorkspaces();
    setSelected(ws.id);
  }

  async function createProject() {
    if (!selected || !newProjectName.trim()) return;
    await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_project", workspaceId: selected, name: newProjectName }),
    });
    setNewProjectName("");
    refreshSelected(selected);
  }

  async function updatePref(patch: Partial<Preferences>) {
    if (!selected) return;
    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_preferences", workspaceId: selected, preferences: patch }),
    });
    setPrefs(await res.json());
  }

  async function deleteWorkspace(id: string) {
    await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_workspace", workspaceId: id }),
    });
    if (selected === id) setSelected(null);
    refreshWorkspaces();
  }

  return (
    <div>
      <PageHeader title="Workspaces" subtitle="No sign-in required — create a local workspace and start using SUPERIOR AI." />
      <div style={{ padding: 32, display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 20, maxWidth: 1100 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card>
            <h3 style={{ margin: "0 0 10px", fontSize: 13, color: "var(--text-mid)", fontWeight: 500 }}>New workspace</h3>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Workspace name"
              style={{ width: "100%", marginBottom: 8, background: "var(--ink-950)", border: "1px solid var(--ink-700)", borderRadius: 8, padding: "8px 10px", color: "var(--text-hi)", fontSize: 13 }}
            />
            <select
              value={newProfile}
              onChange={(e) => setNewProfile(e.target.value)}
              style={{ width: "100%", marginBottom: 10, background: "var(--ink-950)", border: "1px solid var(--ink-700)", borderRadius: 8, padding: "8px 10px", color: "var(--text-hi)", fontSize: 13 }}
            >
              {PROFILES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <button
              onClick={createWorkspace}
              disabled={!newName.trim()}
              style={{ background: "var(--signal)", color: "var(--ink-950)", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer", opacity: !newName.trim() ? 0.6 : 1 }}
            >
              Create
            </button>
          </Card>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {workspaces.map((ws) => (
              <Card key={ws.id} style={{ borderColor: selected === ws.id ? "var(--signal)" : "var(--ink-700)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button
                    onClick={() => setSelected(ws.id)}
                    style={{ background: "transparent", border: "none", color: "var(--text-hi)", fontSize: 13.5, cursor: "pointer", textAlign: "left", padding: 0 }}
                  >
                    {ws.name}
                  </button>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Badge>{ws.profile}</Badge>
                    <button
                      onClick={() => deleteWorkspace(ws.id)}
                      style={{ background: "transparent", border: "none", color: "var(--text-low)", fontSize: 12, cursor: "pointer" }}
                    >
                      delete
                    </button>
                  </div>
                </div>
              </Card>
            ))}
            {workspaces.length === 0 && <span style={{ fontSize: 13, color: "var(--text-low)" }}>No workspaces yet — create one above to get started.</span>}
          </div>
        </div>

        {selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Card>
              <h3 style={{ margin: "0 0 10px", fontSize: 13, color: "var(--text-mid)", fontWeight: 500 }}>Projects</h3>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <input
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Project name"
                  style={{ flex: 1, background: "var(--ink-950)", border: "1px solid var(--ink-700)", borderRadius: 8, padding: "8px 10px", color: "var(--text-hi)", fontSize: 13 }}
                />
                <button onClick={createProject} style={{ background: "var(--ink-700)", color: "var(--text-hi)", border: "none", borderRadius: 8, padding: "0 14px", fontSize: 13, cursor: "pointer" }}>
                  Add
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {projects.map((p) => (
                  <div key={p.id} style={{ fontSize: 13 }}>{p.name}</div>
                ))}
                {projects.length === 0 && <span style={{ fontSize: 13, color: "var(--text-low)" }}>No projects in this workspace yet.</span>}
              </div>
            </Card>

            {prefs && (
              <Card>
                <h3 style={{ margin: "0 0 12px", fontSize: 13, color: "var(--text-mid)", fontWeight: 500 }}>Preferences</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <label style={{ fontSize: 13 }}>
                    Theme{" "}
                    <select
                      value={prefs.theme}
                      onChange={(e) => updatePref({ theme: e.target.value })}
                      style={{ marginLeft: 8, background: "var(--ink-950)", border: "1px solid var(--ink-700)", borderRadius: 6, padding: "4px 8px", color: "var(--text-hi)" }}
                    >
                      <option value="dark">dark</option>
                      <option value="light">light</option>
                      <option value="system">system</option>
                    </select>
                  </label>
                  <label style={{ fontSize: 13 }}>
                    Language{" "}
                    <select
                      value={prefs.language}
                      onChange={(e) => updatePref({ language: e.target.value })}
                      style={{ marginLeft: 8, background: "var(--ink-950)", border: "1px solid var(--ink-700)", borderRadius: 6, padding: "4px 8px", color: "var(--text-hi)" }}
                    >
                      {LANGUAGES.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </label>
                  <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={prefs.keyboardShortcutsEnabled}
                      onChange={(e) => updatePref({ keyboardShortcutsEnabled: e.target.checked })}
                    />
                    Keyboard shortcuts enabled
                  </label>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
