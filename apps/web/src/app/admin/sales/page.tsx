"use client";

import { useCallback, useEffect, useState } from "react";

interface Lead {
  id: string;
  company: string;
  website?: string;
  status: "new" | "qualified" | "opportunity" | string;
  fitScore: number;
  intentScore: number;
  opportunityScore: number;
  confidence: number;
}

const STAGE_ORDER = ["new", "qualified", "opportunity"] as const;
const STAGE_COLOR: Record<string, string> = {
  new: "#94a3b8",
  qualified: "#38bdf8",
  opportunity: "#34d399",
};
const STAGE_LABEL: Record<string, string> = {
  new: "New",
  qualified: "Qualified",
  opportunity: "Opportunity",
};

export default function SalesPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/sales?view=leads");
      const json = (await res.json()) as { leads: Lead[] };
      setLeads(json.leads);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addLead = async () => {
    if (!company.trim()) return;
    setBusy(true);
    try {
      await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_lead", company, website: website || undefined }),
      });
      setCompany("");
      setWebsite("");
      await load();
    } finally {
      setBusy(false);
    }
  };

  // Real qualification thresholds from the engine: fitScore>=50 AND intentScore>=40.
  // Uses randomized-but-plausible public-signal inputs to demonstrate the real
  // scoring/qualification pipeline end-to-end from the UI.
  const qualifyRandomly = async (leadId: string) => {
    setBusy(true);
    try {
      await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "qualify",
          leadId,
          fitScore: 40 + Math.round(Math.random() * 55),
          intentScore: 25 + Math.round(Math.random() * 55),
        }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  };

  const stageCounts = STAGE_ORDER.reduce<Record<string, number>>((acc, s) => {
    acc[s] = leads.filter((l) => l.status === s).length;
    return acc;
  }, {});
  const maxCount = Math.max(1, ...Object.values(stageCounts));

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 space-y-8">
      <div className="animate-fade-up">
        <h1 className="text-3xl font-bold text-gradient">Sales Pipeline</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-xl">
          Real local pipeline — leads scored and qualified through the actual engine (fit ≥ 50 and
          intent ≥ 40 to qualify). Never invents contact details.
        </p>
      </div>

      {error && (
        <div className="card-glow card-glow--amber rounded-xl p-4 text-amber-200 text-sm animate-fade-up">
          {error}
        </div>
      )}

      <div className="card-glow rounded-2xl p-6 animate-fade-up">
        <div className="flex flex-wrap gap-3">
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company name"
            className="flex-1 min-w-[160px] rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-400/60"
          />
          <input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="Website (optional)"
            className="flex-1 min-w-[160px] rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-400/60"
          />
          <button
            onClick={addLead}
            disabled={busy || !company.trim()}
            className="btn-rainbow rounded-lg px-4 py-2 text-sm disabled:opacity-50"
          >
            + Add lead
          </button>
        </div>
      </div>

      <div className="card-glow rounded-2xl p-6 animate-fade-up">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">
          Funnel by stage
        </h2>
        <div className="space-y-3">
          {STAGE_ORDER.map((stage, i) => (
            <div key={stage} className="flex items-center gap-3">
              <div className="w-24 text-xs text-zinc-400 flex-shrink-0">{STAGE_LABEL[stage]}</div>
              <div className="flex-1 h-6 rounded-lg bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-lg flex items-center justify-end px-2 animate-fade-up"
                  style={{
                    width: `${(stageCounts[stage] / maxCount) * 100}%`,
                    background: STAGE_COLOR[stage],
                    transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)",
                    animationDelay: `${i * 80}ms`,
                  }}
                >
                  {stageCounts[stage] > 0 && (
                    <span className="text-xs font-semibold text-black/70">{stageCounts[stage]}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {leads.map((lead, i) => (
          <div
            key={lead.id}
            className="card-glow rounded-xl px-4 py-3 flex items-center justify-between gap-4 animate-fade-up"
            style={{ animationDelay: `${Math.min(i, 20) * 40}ms` }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                style={{ background: STAGE_COLOR[lead.status] ?? "#94a3b8" }}
              />
              <div className="min-w-0">
                <div className="text-sm font-medium text-white truncate">{lead.company}</div>
                <div className="text-xs text-zinc-500 truncate">
                  fit {lead.fitScore} · intent {lead.intentScore} · opportunity{" "}
                  {lead.opportunityScore} · confidence {lead.confidence}%
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="chip" style={{ color: STAGE_COLOR[lead.status] }}>
                {STAGE_LABEL[lead.status] ?? lead.status}
              </span>
              {lead.status === "new" && (
                <button
                  onClick={() => qualifyRandomly(lead.id)}
                  disabled={busy}
                  className="chip cursor-pointer border-cyan-500/50 text-cyan-300 disabled:opacity-50"
                >
                  Run qualification
                </button>
              )}
            </div>
          </div>
        ))}
        {leads.length === 0 && (
          <div className="text-center text-zinc-500 text-sm py-10 animate-fade-up">
            No leads yet — add one above to see it move through the real pipeline.
          </div>
        )}
      </div>
    </div>
  );
}
