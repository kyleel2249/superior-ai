"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, StatusDot, Badge, Stat } from "@/components/ui";

interface Component {
  id: string;
  name: string;
  status: string;
  description?: string;
}
interface StatusResponse {
  overall: string;
  components: Component[];
  incidents: Array<{ id: string; title: string; impact: string }>;
  checkedAt: string;
}
interface MetricsResponse {
  counters: Record<string, number>;
  spanCount: number;
  errorRate: number;
  recentSpans: Array<{ id: string; name: string; status: string; durationMs: number; startedAt: string }>;
}
interface PacksResponse {
  catalog: Array<{ id: string; name: string; category: string; agents: string[]; verified: boolean }>;
}

function useJson<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`${url} → HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(String(e.message ?? e)));
    return () => {
      cancelled = true;
    };
  }, [url]);
  return { data, error };
}

export default function DashboardPage() {
  const { data: status, error: statusError } = useJson<StatusResponse>("/api/status");
  const { data: metrics, error: metricsError } = useJson<MetricsResponse>("/api/metrics");
  const { data: packs, error: packsError } = useJson<PacksResponse>("/api/packs");

  const anyError = statusError || metricsError || packsError;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Live system status, request metrics, and installed agent packs." />
      <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 20, maxWidth: 1100 }}>
        {anyError && (
          <Card style={{ borderColor: "var(--err)" }}>
            <span style={{ color: "var(--err)", fontSize: 13 }}>
              Couldn&apos;t reach one or more API routes: {statusError || metricsError || packsError}
            </span>
          </Card>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <StatusDot status={status?.overall ?? "unknown"} />
              <span style={{ fontSize: 13, color: "var(--text-mid)" }}>Overall status</span>
            </div>
            <Stat
              label="System"
              value={status?.overall ?? "…"}
              tone={status?.overall === "operational" ? "ok" : status?.overall === "outage" ? "err" : "warn"}
            />
          </Card>
          <Card>
            <Stat label="Requests traced" value={metrics?.spanCount ?? "…"} />
          </Card>
          <Card>
            <Stat
              label="Error rate"
              value={metrics ? `${(metrics.errorRate * 100).toFixed(1)}%` : "…"}
              tone={metrics && metrics.errorRate > 0.1 ? "err" : "ok"}
            />
          </Card>
          <Card>
            <Stat label="Packs installed" value={packs?.catalog.length ?? "…"} />
          </Card>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 14 }}>
          <Card>
            <h3 style={{ margin: "0 0 12px", fontSize: 13, color: "var(--text-mid)", fontWeight: 500 }}>Components</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {status?.components.map((c) => (
                <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <StatusDot status={c.status} />
                    {c.name}
                  </span>
                  <span style={{ color: "var(--text-low)", fontSize: 12 }}>{c.description ?? c.status}</span>
                </div>
              ))}
              {!status && <span style={{ color: "var(--text-low)", fontSize: 13 }}>Loading…</span>}
            </div>
          </Card>

          <Card>
            <h3 style={{ margin: "0 0 12px", fontSize: 13, color: "var(--text-mid)", fontWeight: 500 }}>Agent packs</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {packs?.catalog.map((p) => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                  <span>{p.name}</span>
                  <Badge tone={p.verified ? "ok" : "default"}>{p.category}</Badge>
                </div>
              ))}
              {!packs && <span style={{ color: "var(--text-low)", fontSize: 13 }}>Loading…</span>}
            </div>
          </Card>
        </div>

        <Card>
          <h3 style={{ margin: "0 0 12px", fontSize: 13, color: "var(--text-mid)", fontWeight: 500 }}>Recent activity</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {metrics?.recentSpans.length === 0 && <span style={{ color: "var(--text-low)", fontSize: 13 }}>No requests traced yet this run.</span>}
            {metrics?.recentSpans.map((s) => (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12.5,
                  fontFamily: "var(--mono)",
                  color: "var(--text-mid)",
                  padding: "4px 0",
                  borderBottom: "1px solid var(--ink-800)",
                }}
              >
                <span>
                  <StatusDot status={s.status === "ok" ? "ok" : "err"} /> {s.name}
                </span>
                <span>{s.durationMs}ms</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
