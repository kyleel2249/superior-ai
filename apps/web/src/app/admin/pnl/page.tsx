"use client";

import { useCallback, useEffect, useState } from "react";

interface PnL {
  periodLabel: string;
  tasksCompleted: number;
  providerCostUsd: number;
  estimatedLaborValueUsd: number;
  estimatedNetUsd: number;
  avgQuality: number | null;
  humanHoursAvoided: number;
  byDepartment: Array<{ department: string; cost: number; tasks: number }>;
  disclaimer: string;
}

const DEPT_COLOR = ["#38bdf8", "#34d399", "#fbbf24", "#fb7185", "#a78bfa", "#94a3b8"];

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="card-glow rounded-xl p-4">
      <div className="text-2xl font-bold tabular-nums" style={{ color: color ?? "#fff" }}>
        {value}
      </div>
      <div className="text-xs text-zinc-400 mt-1">{label}</div>
      {sub && <div className="text-[10px] text-zinc-600 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function WorkforcePnLPage() {
  const [pnl, setPnl] = useState<PnL | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dept, setDept] = useState("engineering");
  const [cost, setCost] = useState("0.05");
  const [hours, setHours] = useState("0.25");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "workforce_pnl" }),
      });
      const json = (await res.json()) as PnL;
      setPnl(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const recordTask = async () => {
    setBusy(true);
    try {
      await fetch("/api/advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "economics_record",
          department: dept,
          providerCostUsd: Number(cost) || 0,
          humanHoursAvoided: Number(hours) || 0,
          qualityScore: 70 + Math.round(Math.random() * 25),
        }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  };

  const maxDeptCost = Math.max(1, ...(pnl?.byDepartment.map((d) => d.cost) ?? [1]));

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 space-y-8">
      <div className="animate-fade-up">
        <h1 className="text-3xl font-bold text-gradient">AI Workforce P&amp;L</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-xl">
          Real rollup from recorded task economics — not a projection.
        </p>
        {pnl && (
          <p className="mt-1 text-xs text-amber-300/80 max-w-xl">{pnl.disclaimer}</p>
        )}
      </div>

      {error && (
        <div className="card-glow card-glow--amber rounded-xl p-4 text-amber-200 text-sm animate-fade-up">
          {error}
        </div>
      )}

      {pnl && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-fade-up">
          <StatCard label="Tasks completed" value={String(pnl.tasksCompleted)} />
          <StatCard label="Provider cost" value={`$${pnl.providerCostUsd.toFixed(2)}`} color="#fb7185" />
          <StatCard
            label="Est. labor value"
            value={`$${pnl.estimatedLaborValueUsd.toFixed(2)}`}
            sub="$75/hr proxy"
            color="#34d399"
          />
          <StatCard
            label="Est. net"
            value={`$${pnl.estimatedNetUsd.toFixed(2)}`}
            color={pnl.estimatedNetUsd >= 0 ? "#34d399" : "#fb7185"}
          />
          <StatCard label="Hours avoided" value={pnl.humanHoursAvoided.toFixed(1)} />
          <StatCard label="Avg quality" value={pnl.avgQuality != null ? pnl.avgQuality.toFixed(1) : "—"} />
        </div>
      )}

      <div className="card-glow card-glow--cyan rounded-2xl p-6 animate-fade-up">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">
          Record a task (demo)
        </h2>
        <div className="flex flex-wrap gap-2">
          <input
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            placeholder="department"
            className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-white w-32"
          />
          <input
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="cost USD"
            className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-white w-24"
          />
          <input
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="hrs avoided"
            className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-white w-28"
          />
          <button
            onClick={recordTask}
            disabled={busy}
            className="btn-rainbow rounded-lg px-4 py-1.5 text-sm disabled:opacity-50"
          >
            {busy ? "Recording…" : "Record"}
          </button>
        </div>
      </div>

      <div className="card-glow rounded-2xl p-6 animate-fade-up">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-4">
          Cost by department
        </h2>
        <div className="space-y-3">
          {(pnl?.byDepartment ?? []).map((d, i) => (
            <div key={d.department} className="flex items-center gap-3">
              <div className="w-28 text-xs text-zinc-400 truncate flex-shrink-0">{d.department}</div>
              <div className="flex-1 h-5 rounded-lg bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-lg animate-fade-up"
                  style={{
                    width: `${(d.cost / maxDeptCost) * 100}%`,
                    background: DEPT_COLOR[i % DEPT_COLOR.length],
                    transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)",
                  }}
                />
              </div>
              <div className="w-20 text-xs text-zinc-400 text-right flex-shrink-0">
                ${d.cost.toFixed(2)} · {d.tasks}
              </div>
            </div>
          ))}
          {pnl && pnl.byDepartment.length === 0 && (
            <div className="text-center text-zinc-500 text-sm py-6">
              No tasks recorded yet — use the form above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
