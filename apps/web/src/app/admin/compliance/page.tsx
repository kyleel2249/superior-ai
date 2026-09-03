"use client";

import { useCallback, useEffect, useState } from "react";

interface ReadinessItem {
  evidence_id: string;
  description: string;
  status: string;
  collected: boolean;
  ownerAssigned: boolean;
}

interface ReadinessCriterion {
  total: number;
  collected: number;
  unfilledOwnerOrLocation: number;
  items: ReadinessItem[];
}

interface Readiness {
  available: boolean;
  reason?: string;
  generatedAt?: string;
  note?: string;
  overallPercent?: number;
  totals?: { total: number; collected: number };
  byCriterion?: Record<string, ReadinessCriterion>;
}

const CRITERION_GLOW: Record<string, string> = {
  CC1: "card-glow--indigo",
  CC6: "card-glow--fuchsia",
  CC7: "card-glow--cyan",
  CC8: "card-glow--amber",
  A1: "card-glow--emerald",
};

const CRITERION_LABEL: Record<string, string> = {
  CC1: "Control Environment",
  CC6: "Logical Access",
  CC7: "System Operations",
  CC8: "Change Management",
  A1: "Availability",
};

function ringColor(pct: number): string {
  if (pct >= 80) return "#34d399"; // emerald
  if (pct >= 40) return "#fbbf24"; // amber
  return "#fb7185"; // rose
}

function ProgressRing({ percent }: { percent: number }) {
  const size = 128;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - percent / 100);
  return (
    <svg width={size} height={size} className="animate-fade-up">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={ringColor(percent)}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{
          transition: "stroke-dashoffset 1.1s cubic-bezier(0.16,1,0.3,1), stroke 0.6s ease",
        }}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="text-2xl font-bold fill-white"
      >
        {percent}%
      </text>
    </svg>
  );
}

function CriterionBar({ pct }: { pct: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full rounded-full animate-pulse-glow"
        style={{
          width: `${pct}%`,
          background: "#6366f1",
          transition: "width 0.9s cubic-bezier(0.16,1,0.3,1)",
        }}
      />
    </div>
  );
}

export default function CompliancePage() {
  const [data, setData] = useState<Readiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/compliance/readiness");
      const json = (await res.json()) as Readiness;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      <div className="animate-fade-up">
        <h1 className="text-3xl font-bold text-gradient">Compliance Readiness</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-2xl">
          Tracks how complete your SOC 2 evidence pack is —{" "}
          <span className="text-zinc-300 font-medium">not a certification or audit result</span>.
          Every number below comes straight from{" "}
          <code className="chip">docs/soc2/Evidence_Index.csv</code>.
        </p>
      </div>

      {loading && (
        <div className="animate-pulse-glow text-zinc-400">Loading readiness…</div>
      )}
      {error && (
        <div className="card-glow card-glow--amber rounded-xl p-4 text-amber-200 text-sm">
          Couldn&apos;t load readiness data: {error}
        </div>
      )}

      {data && !data.available && (
        <div className="card-glow card-glow--amber rounded-xl p-6 text-amber-200">
          {data.reason}
        </div>
      )}

      {data && data.available && (
        <>
          <div className="card-glow card-glow--intense rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-8 animate-fade-up">
            <ProgressRing percent={data.overallPercent ?? 0} />
            <div>
              <div className="text-lg font-semibold text-white">
                {data.totals?.collected ?? 0} of {data.totals?.total ?? 0} evidence items collected
              </div>
              <div className="mt-1 text-sm text-zinc-400">{data.note}</div>
              {data.generatedAt && (
                <div className="mt-3 text-xs text-zinc-500">
                  Last computed {new Date(data.generatedAt).toLocaleString()}
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {Object.entries(data.byCriterion ?? {}).map(([criterion, c], i) => {
              const pct = c.total > 0 ? Math.round((c.collected / c.total) * 100) : 0;
              const glow = CRITERION_GLOW[criterion] ?? "card-glow--indigo";
              return (
                <div
                  key={criterion}
                  className={`card-glow ${glow} rounded-xl p-5 animate-fade-up`}
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-semibold text-white">{criterion}</div>
                      <div className="text-xs text-zinc-400">
                        {CRITERION_LABEL[criterion] ?? "Additional criterion"}
                      </div>
                    </div>
                    <div className="text-sm font-mono text-zinc-300">
                      {c.collected}/{c.total}
                    </div>
                  </div>
                  <CriterionBar pct={pct} />
                  <ul className="mt-4 space-y-1.5">
                    {c.items.map((item) => (
                      <li
                        key={item.evidence_id}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className={item.collected ? "text-zinc-300" : "text-zinc-500"}>
                          {item.description}
                        </span>
                        <span
                          className={`chip ${
                            item.collected
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : "bg-zinc-700/40 text-zinc-400 border-zinc-600"
                          }`}
                        >
                          {item.collected ? "collected" : item.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
