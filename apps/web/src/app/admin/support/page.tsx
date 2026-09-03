"use client";

import { useCallback, useEffect, useState } from "react";

interface Ticket {
  id: string;
  subject: string;
  body: string;
  sentiment: string;
  assignedRole: string;
  status: string;
  history: string[];
  resolution?: string;
}

const SENTIMENT_COLOR: Record<string, string> = {
  angry: "#fb7185",
  urgent: "#fb7185",
  frustrated: "#fbbf24",
  disappointed: "#fbbf24",
  confused: "#a78bfa",
  uncertain: "#a78bfa",
  satisfied: "#34d399",
  neutral: "#94a3b8",
};

const STATUS_COLOR: Record<string, string> = {
  open: "#38bdf8",
  pending: "#fbbf24",
  escalated: "#fb7185",
  resolved: "#34d399",
};

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [trends, setTrends] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/support");
      const json = (await res.json()) as { tickets: Ticket[]; trends: string[] };
      setTickets(json.tickets);
      setTrends(json.trends);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submitTicket = async () => {
    if (!subject.trim() || !body.trim()) return;
    setBusy(true);
    try {
      await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "open", subject, body }),
      });
      setSubject("");
      setBody("");
      await load();
    } finally {
      setBusy(false);
    }
  };

  const resolve = async (id: string) => {
    setBusy(true);
    try {
      await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resolve", id, resolution: "Resolved from dashboard" }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 space-y-8">
      <div className="animate-fade-up">
        <h1 className="text-3xl font-bold text-gradient">Support Tickets</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-xl">
          Real sentiment detection and role routing — angry/urgent tickets auto-escalate.
        </p>
      </div>

      {error && (
        <div className="card-glow card-glow--amber rounded-xl p-4 text-amber-200 text-sm animate-fade-up">
          {error}
        </div>
      )}

      {trends.length > 0 && (
        <div className="card-glow card-glow--amber rounded-2xl p-5 animate-fade-up">
          <h2 className="text-xs font-semibold text-amber-300 uppercase tracking-wide mb-2">
            Trend alerts
          </h2>
          {trends.map((t) => (
            <p key={t} className="text-sm text-amber-200">
              {t}
            </p>
          ))}
        </div>
      )}

      <div className="card-glow rounded-2xl p-6 animate-fade-up">
        <div className="space-y-2">
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-400/60"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Describe the issue… try something urgent or frustrated to see auto-escalation"
            rows={2}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-400/60"
          />
          <button
            onClick={submitTicket}
            disabled={busy || !subject.trim() || !body.trim()}
            className="btn-rainbow rounded-lg px-4 py-2 text-sm disabled:opacity-50"
          >
            Submit ticket
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {tickets.map((t, i) => (
          <div
            key={t.id}
            className="card-glow rounded-xl px-4 py-3 animate-fade-up"
            style={{ animationDelay: `${Math.min(i, 20) * 40}ms` }}
          >
            <div className="flex items-center justify-between gap-3 mb-1">
              <span className="text-sm font-medium text-white truncate">{t.subject}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="chip" style={{ color: SENTIMENT_COLOR[t.sentiment] }}>
                  {t.sentiment}
                </span>
                <span className="chip" style={{ color: STATUS_COLOR[t.status] }}>
                  {t.status}
                </span>
              </div>
            </div>
            <div className="text-xs text-zinc-500 mb-2">
              routed to <span className="text-zinc-300">{t.assignedRole.replace(/_/g, " ")}</span>
            </div>
            {t.status !== "resolved" && (
              <button
                onClick={() => resolve(t.id)}
                disabled={busy}
                className="chip cursor-pointer border-emerald-500/50 text-emerald-300 text-xs disabled:opacity-50"
              >
                Mark resolved
              </button>
            )}
          </div>
        ))}
        {tickets.length === 0 && (
          <div className="text-center text-zinc-500 text-sm py-10 animate-fade-up">
            No tickets yet — submit one above.
          </div>
        )}
      </div>
    </div>
  );
}
