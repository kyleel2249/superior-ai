"use client";

import { useState, useEffect } from "react";
import { PageHeader, Card, Badge } from "@/components/ui";

interface OrchestratorResult {
  objective: string;
  mode: string;
  packsConsidered: string[];
  agentsAssigned: string[];
  steps: Array<{ order: number; agent: string; action: string }>;
  notes: string[];
}

interface FactoryTask {
  id: string;
  objective: string;
  stage: string;
  approvedForImplementation: boolean;
  log: Array<{ at: string; stage: string; note: string }>;
}

const STAGE_TONE: Record<string, "default" | "signal" | "ok" | "warn" | "err"> = {
  planning: "default",
  implementing: "signal",
  testing: "signal",
  review: "warn",
  done: "ok",
  failed: "err",
};

export default function WorkspacePage() {
  const [objective, setObjective] = useState("");
  const [plan, setPlan] = useState<OrchestratorResult | null>(null);
  const [planning, setPlanning] = useState(false);
  const [tasks, setTasks] = useState<FactoryTask[]>([]);
  const [newTaskObjective, setNewTaskObjective] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function refreshTasks() {
    try {
      const res = await fetch("/api/factory");
      const data = await res.json();
      setTasks(data.tasks ?? data ?? []);
    } catch {
      // non-fatal — task list just stays stale
    }
  }

  useEffect(() => {
    refreshTasks();
  }, []);

  async function runPlan() {
    if (!objective.trim()) return;
    setPlanning(true);
    setError(null);
    try {
      const res = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objective }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setPlan(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPlanning(false);
    }
  }

  async function createTask() {
    if (!newTaskObjective.trim()) return;
    await fetch("/api/factory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ objective: newTaskObjective }),
    });
    setNewTaskObjective("");
    refreshTasks();
  }

  async function advanceTask(id: string, approve: boolean) {
    await fetch("/api/factory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "advance", taskId: id, approve }),
    });
    refreshTasks();
  }

  return (
    <div>
      <PageHeader title="Workspace" subtitle="Plan objectives across agent packs, then track factory tasks through human-approved stages." />
      <div style={{ padding: 32, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 1200 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card>
            <h3 style={{ margin: "0 0 10px", fontSize: 13, color: "var(--text-mid)", fontWeight: 500 }}>Orchestrator</h3>
            <textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="e.g. launch a growth campaign for our SaaS product"
              rows={3}
              style={{
                width: "100%",
                background: "var(--ink-950)",
                border: "1px solid var(--ink-700)",
                borderRadius: 8,
                padding: 10,
                color: "var(--text-hi)",
                fontSize: 13.5,
                resize: "vertical",
              }}
            />
            <button
              onClick={runPlan}
              disabled={planning || !objective.trim()}
              style={{
                marginTop: 10,
                background: "var(--signal)",
                color: "var(--ink-950)",
                border: "none",
                borderRadius: 8,
                padding: "8px 16px",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                opacity: planning || !objective.trim() ? 0.6 : 1,
              }}
            >
              {planning ? "Planning…" : "Plan"}
            </button>
            {error && <p style={{ color: "var(--err)", fontSize: 12.5, marginTop: 8 }}>{error}</p>}
          </Card>

          {plan && (
            <Card>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                {plan.packsConsidered.map((p) => (
                  <Badge key={p}>{p}</Badge>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {plan.steps.map((s) => (
                  <div key={s.order} style={{ fontSize: 13, display: "flex", gap: 10 }}>
                    <span style={{ color: "var(--text-low)", fontFamily: "var(--mono)", fontSize: 12 }}>{s.order}.</span>
                    <span>
                      <strong style={{ color: "var(--signal)" }}>{s.agent}</strong> — {s.action}
                    </span>
                  </div>
                ))}
              </div>
              {plan.notes.map((n, i) => (
                <p key={i} style={{ fontSize: 12, color: "var(--text-low)", marginTop: 10 }}>
                  {n}
                </p>
              ))}
            </Card>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card>
            <h3 style={{ margin: "0 0 10px", fontSize: 13, color: "var(--text-mid)", fontWeight: 500 }}>New factory task</h3>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={newTaskObjective}
                onChange={(e) => setNewTaskObjective(e.target.value)}
                placeholder="e.g. add dark mode toggle"
                style={{
                  flex: 1,
                  background: "var(--ink-950)",
                  border: "1px solid var(--ink-700)",
                  borderRadius: 8,
                  padding: "8px 10px",
                  color: "var(--text-hi)",
                  fontSize: 13,
                }}
              />
              <button
                onClick={createTask}
                style={{ background: "var(--ink-700)", color: "var(--text-hi)", border: "none", borderRadius: 8, padding: "0 14px", fontSize: 13, cursor: "pointer" }}
              >
                Create
              </button>
            </div>
          </Card>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {tasks.length === 0 && (
              <Card>
                <span style={{ fontSize: 13, color: "var(--text-low)" }}>No factory tasks yet.</span>
              </Card>
            )}
            {tasks.map((t) => (
              <Card key={t.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13.5 }}>{t.objective}</span>
                  <Badge tone={STAGE_TONE[t.stage] ?? "default"}>{t.stage}</Badge>
                </div>
                {t.stage === "planning" && !t.approvedForImplementation && (
                  <button
                    onClick={() => advanceTask(t.id, true)}
                    style={{
                      background: "var(--signal)",
                      color: "var(--ink-950)",
                      border: "none",
                      borderRadius: 6,
                      padding: "5px 10px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Approve → implementing
                  </button>
                )}
                {t.stage !== "planning" && t.stage !== "done" && t.stage !== "failed" && (
                  <button
                    onClick={() => advanceTask(t.id, false)}
                    style={{ background: "var(--ink-700)", color: "var(--text-hi)", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 12, cursor: "pointer" }}
                  >
                    Advance
                  </button>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
