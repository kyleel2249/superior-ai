"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, Badge } from "@/components/ui";

interface Pack {
  id: string;
  name: string;
  version: string;
  category: string;
  description: string;
  agents: string[];
  verified: boolean;
}

const ORG_ID = "org_dev";

export default function AdminPacksPage() {
  const [catalog, setCatalog] = useState<Pack[]>([]);
  const [installed, setInstalled] = useState<Array<{ packId: string; enabled: boolean }>>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      const res = await fetch(`/api/packs?organizationId=${ORG_ID}`);
      const data = await res.json();
      setCatalog(data.catalog ?? []);
      setInstalled(data.installed ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const installedIds = new Set(installed.filter((i) => i.enabled).map((i) => i.packId));

  async function toggle(packId: string, install: boolean) {
    setBusy(packId);
    try {
      await fetch("/api/packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: install ? "install" : "uninstall", packId, organizationId: ORG_ID }),
      });
      await refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <PageHeader title="Agent Packs" subtitle="Install and manage agent packs for this organization." />
      <div style={{ padding: 32, maxWidth: 900 }}>
        {error && (
          <Card style={{ borderColor: "var(--err)", marginBottom: 14 }}>
            <span style={{ color: "var(--err)", fontSize: 13 }}>{error}</span>
          </Card>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {catalog.map((p) => {
            const isInstalled = installedIds.has(p.id);
            return (
              <Card key={p.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14.5, fontWeight: 600 }}>{p.name}</span>
                      <Badge>{p.category}</Badge>
                      <Badge tone={p.verified ? "ok" : "default"}>{p.verified ? "verified" : "unverified"}</Badge>
                      <span style={{ fontSize: 11, color: "var(--text-low)", fontFamily: "var(--mono)" }}>v{p.version}</span>
                    </div>
                    <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--text-mid)" }}>{p.description}</p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {p.agents.map((a) => (
                        <span key={a} style={{ fontSize: 11, color: "var(--text-low)", fontFamily: "var(--mono)" }}>
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => toggle(p.id, !isInstalled)}
                    disabled={busy === p.id}
                    style={{
                      flexShrink: 0,
                      background: isInstalled ? "var(--ink-700)" : "var(--signal)",
                      color: isInstalled ? "var(--text-hi)" : "var(--ink-950)",
                      border: "none",
                      borderRadius: 8,
                      padding: "7px 14px",
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: "pointer",
                      opacity: busy === p.id ? 0.6 : 1,
                    }}
                  >
                    {busy === p.id ? "…" : isInstalled ? "Uninstall" : "Install"}
                  </button>
                </div>
              </Card>
            );
          })}
          {catalog.length === 0 && !error && <span style={{ fontSize: 13, color: "var(--text-low)" }}>Loading catalog…</span>}
        </div>
      </div>
    </div>
  );
}
