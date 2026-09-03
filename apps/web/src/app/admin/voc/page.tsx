"use client";

import { useState } from "react";

interface VocTheme {
  theme: string;
  count: number;
  sentiment: "positive" | "negative" | "mixed" | "neutral";
  examples: string[];
  productImplication?: string;
  marketingImplication?: string;
}

interface VocReport {
  sampleSize: number;
  themes: VocTheme[];
  npsShell: { score: number | null; note: string };
  csatShell: { score: number | null; note: string };
  retentionRisks: string[];
  opportunities: string[];
  provenance: string;
}

const SENTIMENT_COLOR: Record<string, string> = {
  positive: "#34d399",
  negative: "#fb7185",
  mixed: "#fbbf24",
  neutral: "#94a3b8",
};

const SAMPLE = `The pricing feels too expensive for what we get
App crashed twice this week, pretty buggy
So easy to use, our team loves the interface
Support took 3 days to respond, frustrating
Onboarding was confusing at first but we figured it out
Really wish it had a Slack integration`;

export default function VocPage() {
  const [text, setText] = useState(SAMPLE);
  const [report, setReport] = useState<VocReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async () => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    setBusy(true);
    try {
      const res = await fetch("/api/cx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "voc", texts: lines }),
      });
      const json = (await res.json()) as VocReport;
      setReport(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const maxCount = Math.max(1, ...(report?.themes.map((t) => t.count) ?? [1]));

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 space-y-8">
      <div className="animate-fade-up">
        <h1 className="text-3xl font-bold text-gradient">Voice of Customer</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-xl">
          Real theme detection from pasted feedback — one line per piece of feedback. NPS/CSAT
          stay null until real survey data exists; they&apos;re never estimated from text.
        </p>
      </div>

      {error && (
        <div className="card-glow card-glow--amber rounded-xl p-4 text-amber-200 text-sm animate-fade-up">
          {error}
        </div>
      )}

      <div className="card-glow rounded-2xl p-6 animate-fade-up">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-400/60 font-mono"
        />
        <button
          onClick={analyze}
          disabled={busy}
          className="btn-rainbow rounded-lg px-4 py-2 text-sm disabled:opacity-50 mt-3"
        >
          {busy ? "Analyzing…" : "Analyze feedback"}
        </button>
      </div>

      {report && (
        <>
          <div className="grid sm:grid-cols-2 gap-4 animate-fade-up">
            <div className="card-glow card-glow--indigo rounded-xl p-4">
              <div className="text-xs text-zinc-400 mb-1">NPS</div>
              <div className="text-2xl font-bold text-zinc-500">—</div>
              <div className="text-[11px] text-zinc-600 mt-1">{report.npsShell.note}</div>
            </div>
            <div className="card-glow card-glow--indigo rounded-xl p-4">
              <div className="text-xs text-zinc-400 mb-1">CSAT</div>
              <div className="text-2xl font-bold text-zinc-500">—</div>
              <div className="text-[11px] text-zinc-600 mt-1">{report.csatShell.note}</div>
            </div>
          </div>

          <div className="card-glow rounded-2xl p-6 animate-fade-up">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-4">
              Themes ({report.sampleSize} feedback items)
            </h2>
            <div className="space-y-3">
              {report.themes.map((t, i) => (
                <div key={t.theme} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-32 text-xs text-zinc-300 capitalize flex-shrink-0">{t.theme}</div>
                    <div className="flex-1 h-4 rounded bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded"
                        style={{
                          width: `${(t.count / maxCount) * 100}%`,
                          background: SENTIMENT_COLOR[t.sentiment],
                          transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)",
                        }}
                      />
                    </div>
                    <span className="text-xs text-zinc-500 w-6 text-right">{t.count}</span>
                  </div>
                  {t.examples[0] && (
                    <div className="text-[11px] text-zinc-600 ml-[8.75rem] italic truncate">
                      &ldquo;{t.examples[0]}&rdquo;
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {report.retentionRisks.length > 0 && (
              <div className="card-glow card-glow--amber rounded-xl p-4 animate-fade-up">
                <h3 className="text-xs font-semibold text-amber-300 uppercase mb-2">
                  Retention risks
                </h3>
                {report.retentionRisks.map((r) => (
                  <p key={r} className="text-xs text-amber-200/80">
                    {r}
                  </p>
                ))}
              </div>
            )}
            {report.opportunities.length > 0 && (
              <div className="card-glow card-glow--emerald rounded-xl p-4 animate-fade-up">
                <h3 className="text-xs font-semibold text-emerald-300 uppercase mb-2">
                  Opportunities
                </h3>
                {report.opportunities.map((o) => (
                  <p key={o} className="text-xs text-emerald-200/80">
                    {o}
                  </p>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
