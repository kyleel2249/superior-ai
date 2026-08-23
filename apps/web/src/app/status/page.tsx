"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, StatusDot, Badge } from "@/components/ui";

interface StatusResponse {
  overall: string;
  components: Array<{ id: string; name: string; status: string; description?: string }>;
  incidents: Array<{ id: string; title: string; body: string; impact: string; createdAt: string; resolvedAt?: string }>;
  checkedAt: string;
}

export default function StatusPage() {
  const [data, setData] = useState<StatusResponse | null>(null);

  useEffect(() => {
    const load = () => fetch("/api/status").then((r) => r.json()).then(setData);
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <PageHeader title="System Status" subtitle="Live, auto-refreshing every 30s." />
      <div style={{ padding: 32, maxWidth: 700, display: "flex", flexDirection: "column", gap: 16 }}>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <StatusDot status={data?.overall ?? "unknown"} />
            <span style={{ fontSize: 16, fontWeight: 600, textTransform: "capitalize" }}>{data?.overall ?? "Checking…"}</span>
          </div>
        </Card>

        <Card>
          <h3 style={{ margin: "0 0 12px", fontSize: 13, color: "var(--text-mid)", fontWeight: 500 }}>Components</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {data?.components.map((c) => (
              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5 }}>
                  <StatusDot status={c.status} />
                  {c.name}
                </span>
                <Badge tone={c.status === "operational" ? "ok" : c.status === "outage" ? "err" : "default"}>{c.status}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 style={{ margin: "0 0 12px", fontSize: 13, color: "var(--text-mid)", fontWeight: 500 }}>Incidents</h3>
          {data?.incidents.length === 0 && <span style={{ fontSize: 13, color: "var(--text-low)" }}>No incidents reported.</span>}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {data?.incidents.map((inc) => (
              <div key={inc.id} style={{ fontSize: 13 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span>{inc.title}</span>
                  <Badge tone={inc.impact === "critical" ? "err" : inc.impact === "major" ? "warn" : "default"}>{inc.impact}</Badge>
                  {inc.resolvedAt && <Badge tone="ok">resolved</Badge>}
                </div>
                <p style={{ margin: "4px 0 0", color: "var(--text-mid)", fontSize: 12.5 }}>{inc.body}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
