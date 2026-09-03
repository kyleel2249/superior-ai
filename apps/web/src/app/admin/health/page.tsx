"use client";

import { useCallback, useEffect, useState } from "react";

interface StatusComponent {
  id: string;
  name: string;
  status: "operational" | "degraded" | "outage" | "unknown";
  description?: string;
  updatedAt: string;
}

interface StatusPulse {
  overall: string;
  components: StatusComponent[];
  incidents: unknown[];
  checkedAt: string;
  product: string;
}

interface SelfTestResult {
  id: string;
  name: string;
  status: "pass" | "fail" | "warn" | "skip";
  detail: string;
  durationMs: number;
}

interface SelfTestReport {
  id: string;
  startedAt: string;
  finishedAt: string;
  results: SelfTestResult[];
  summary: { pass: number; fail: number; warn: number; skip: number };
  overall: string;
}

const STATUS_COLOR: Record<string, string> = {
  operational: "#34d399",
  pass: "#34d399",
  degraded: "#fbbf24",
  warn: "#fbbf24",
  outage: "#fb7185",
  fail: "#fb7185",
  unknown: "#94a3b8",
  skip: "#94a3b8",
};

function Dot({ status }: { status: string }) {
  const color = STATUS_COLOR[status] ?? "#94a3b8";
  return (
    <span
      className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
      style={{ background: color, boxShadow: status === "operational" || status === "pass" ? `0 0 6px ${color}` : "none" }}
    />
  );
}

export default function HealthPage() {
  const [pulse, setPulse] = useState<StatusPulse | null>(null);
  const [report, setReport] = useState<SelfTestReport | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const loadPulse = useCallback(async () => {
    try {
      const res = await fetch("/api/self-test?view=pulse");
      const json = (await res.json()) as StatusPulse;
      setPulse(json);
      setLastChecked(new Date());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const runSelfTest = useCallback(async () => {
    setRunning(true);
    try {
      const res = await fetch("/api/self-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run" }),
      });
      const json = (await res.json()) as SelfTestReport;
      setReport(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  }, []);

  useEffect(() => {
    loadPulse();
    runSelfTest();
  }, [loadPulse, runSelfTest]);

  useEffect(() => {
    const interval = setInterval(loadPulse, 10000);
    return () => clearInterval(interval);
  }, [loadPulse]);

  const overallColor = pulse
    ? STATUS_COLOR[pulse.overall] ?? "#94a3b8"
    : "#94a3b8";

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 space-y-8">
      <div className="animate-fade-up flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">System Health</h1>
          <p className="mt-2 text-sm text-zinc-400 max-w-xl">
            Live status of real subsystems — nothing here is simulated. Degraded means the
            environment variable or service genuinely isn&apos;t configured in this process.
          </p>
        </div>
        <button
          onClick={runSelfTest}
          disabled={running}
          className="btn-rainbow rounded-lg px-4 py-2 text-sm disabled:opacity-50"
        >
          {running ? "Running…" : "Run self-test"}
        </button>
      </div>

      {error && (
        <div className="card-glow card-glow--amber rounded-xl p-4 text-amber-200 text-sm animate-fade-up">
          {error}
        </div>
      )}

      {pulse && (
        <div className="card-glow rounded-2xl p-6 animate-fade-up">
          <div className="flex items-center gap-3 mb-5">
            <span
              className="h-3 w-3 rounded-full animate-pulse-glow"
              style={{ background: overallColor }}
            />
            <span className="text-lg font-semibold text-white capitalize">{pulse.overall}</span>
            {lastChecked && (
              <span className="text-xs text-zinc-500 ml-auto">
                checked {lastChecked.toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {pulse.components.map((c) => (
              <div
                key={c.id}
                className="flex items-start gap-3 rounded-lg bg-white/5 px-3 py-2.5"
              >
                <div className="mt-1">
                  <Dot status={c.status} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm text-white">{c.name}</div>
                  {c.description && (
                    <div className="text-xs text-zinc-500 mt-0.5">{c.description}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {report && (
        <div className="card-glow card-glow--indigo rounded-2xl p-6 animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
              Self-test suite
            </h2>
            <div className="flex gap-2 text-xs">
              <span className="chip" style={{ color: STATUS_COLOR.pass }}>
                {report.summary.pass} pass
              </span>
              {report.summary.warn > 0 && (
                <span className="chip" style={{ color: STATUS_COLOR.warn }}>
                  {report.summary.warn} warn
                </span>
              )}
              {report.summary.fail > 0 && (
                <span className="chip" style={{ color: STATUS_COLOR.fail }}>
                  {report.summary.fail} fail
                </span>
              )}
            </div>
          </div>
          <div className="space-y-2">
            {report.results.map((r, i) => (
              <div
                key={r.id}
                className="flex items-center gap-3 text-sm animate-fade-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <Dot status={r.status} />
                <span className="text-white flex-shrink-0">{r.name}</span>
                <span className="text-zinc-500 text-xs truncate">{r.detail}</span>
                <span className="text-zinc-600 text-xs ml-auto flex-shrink-0">
                  {r.durationMs}ms
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
