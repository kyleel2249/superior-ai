"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, Badge } from "@/components/ui";

interface PublisherAccount {
  id: string;
  name: string;
  email: string;
  shareBps: number;
}
interface RevenueEvent {
  id: string;
  packId: string;
  publisherId: string;
  grossUsd: number;
  publisherShareUsd: number;
  status: string;
}

export default function PublisherPage() {
  const [publishers, setPublishers] = useState<PublisherAccount[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [balance, setBalance] = useState<{ accruedUsd: number; paidUsd: number; pendingUsd: number } | null>(null);
  const [events, setEvents] = useState<RevenueEvent[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshPublishers() {
    const res = await fetch("/api/publishers");
    const data = await res.json();
    setPublishers(data.publishers ?? []);
  }

  useEffect(() => {
    refreshPublishers();
  }, []);

  useEffect(() => {
    if (!selected) return;
    fetch(`/api/publishers?publisherId=${selected}`)
      .then((r) => r.json())
      .then((d) => {
        setBalance(d.balance ?? null);
        setEvents(d.events ?? []);
      });
  }, [selected]);

  async function register() {
    if (!name.trim() || !email.trim()) return;
    setRegistering(true);
    setError(null);
    try {
      const res = await fetch("/api/publishers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register", name, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setName("");
      setEmail("");
      await refreshPublishers();
      setSelected(data.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRegistering(false);
    }
  }

  return (
    <div>
      <PageHeader title="Publisher" subtitle="Register as a pack publisher and track revenue share from installs." />
      <div style={{ padding: 32, display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 20, maxWidth: 1100 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card>
            <h3 style={{ margin: "0 0 10px", fontSize: 13, color: "var(--text-mid)", fontWeight: 500 }}>Register publisher</h3>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Publisher name"
              style={{ width: "100%", marginBottom: 8, background: "var(--ink-950)", border: "1px solid var(--ink-700)", borderRadius: 8, padding: "8px 10px", color: "var(--text-hi)", fontSize: 13 }}
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              style={{ width: "100%", marginBottom: 10, background: "var(--ink-950)", border: "1px solid var(--ink-700)", borderRadius: 8, padding: "8px 10px", color: "var(--text-hi)", fontSize: 13 }}
            />
            <button
              onClick={register}
              disabled={registering}
              style={{ background: "var(--signal)", color: "var(--ink-950)", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer", opacity: registering ? 0.6 : 1 }}
            >
              {registering ? "…" : "Register"}
            </button>
            {error && <p style={{ color: "var(--err)", fontSize: 12.5, marginTop: 8 }}>{error}</p>}
          </Card>

          <Card>
            <h3 style={{ margin: "0 0 10px", fontSize: 13, color: "var(--text-mid)", fontWeight: 500 }}>Publishers</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {publishers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  style={{
                    textAlign: "left",
                    background: selected === p.id ? "var(--ink-800)" : "transparent",
                    border: "1px solid var(--ink-700)",
                    borderRadius: 8,
                    padding: "8px 10px",
                    color: "var(--text-hi)",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {p.name} <span style={{ color: "var(--text-low)", fontSize: 11 }}>({(p.shareBps / 100).toFixed(0)}% share)</span>
                </button>
              ))}
              {publishers.length === 0 && <span style={{ fontSize: 13, color: "var(--text-low)" }}>No publishers registered yet.</span>}
            </div>
          </Card>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {selected && balance && (
            <Card>
              <h3 style={{ margin: "0 0 12px", fontSize: 13, color: "var(--text-mid)", fontWeight: 500 }}>Balance</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-low)" }}>Accrued</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 18 }}>${balance.accruedUsd.toFixed(2)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-low)" }}>Paid</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 18, color: "var(--ok)" }}>${balance.paidUsd.toFixed(2)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-low)" }}>Pending</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 18, color: "var(--warn)" }}>${balance.pendingUsd.toFixed(2)}</div>
                </div>
              </div>
            </Card>
          )}
          <Card>
            <h3 style={{ margin: "0 0 12px", fontSize: 13, color: "var(--text-mid)", fontWeight: 500 }}>Revenue events</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {events.map((e) => (
                <div key={e.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, fontFamily: "var(--mono)" }}>
                  <span>{e.packId}</span>
                  <span>
                    ${e.publisherShareUsd.toFixed(2)} <Badge tone={e.status === "paid" ? "ok" : "default"}>{e.status}</Badge>
                  </span>
                </div>
              ))}
              {events.length === 0 && <span style={{ fontSize: 13, color: "var(--text-low)" }}>{selected ? "No revenue events yet." : "Select a publisher to view revenue."}</span>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
