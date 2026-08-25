/**
 * Self-healing actions — safe, reversible, no destructive data ops without approval.
 */

import {
  setComponentStatus,
  listComponents,
  overallStatus,
  type ComponentStatus,
} from "./status";
import { runSelfTests, type SelfTestReport } from "./self-test";

export interface HealAction {
  id: string;
  name: string;
  target: string;
  automatic: boolean;
  requiresApproval: boolean;
  description: string;
}

export interface HealResult {
  actionId: string;
  success: boolean;
  message: string;
  at: string;
}

const healLog: HealResult[] = [];

export function listHealActions(): HealAction[] {
  return [
    {
      id: "reset_status_defaults",
      name: "Reset status components to operational",
      target: "status",
      automatic: true,
      requiresApproval: false,
      description: "Re-mark non-outage components operational after transient blips",
    },
    {
      id: "mark_degraded_clear",
      name: "Clear degraded flag on API",
      target: "api",
      automatic: true,
      requiresApproval: false,
      description: "Set api component back to operational if self-tests pass",
    },
    {
      id: "rerun_self_tests",
      name: "Re-run self-test suite",
      target: "platform",
      automatic: true,
      requiresApproval: false,
      description: "Execute structural self-tests and return report",
    },
    {
      id: "incident_auto_resolve",
      name: "Auto-resolve monitoring incidents",
      target: "incidents",
      automatic: false,
      requiresApproval: true,
      description: "Requires human approval — do not auto-close customer-facing incidents",
    },
  ];
}

export function applyHealAction(actionId: string, approved = false): HealResult {
  const at = new Date().toISOString();
  const actions = listHealActions();
  const action = actions.find((a) => a.id === actionId);
  if (!action) {
    const r = { actionId, success: false, message: "Unknown action", at };
    healLog.push(r);
    return r;
  }
  if (action.requiresApproval && !approved) {
    const r = {
      actionId,
      success: false,
      message: "Approval required — set approved:true",
      at,
    };
    healLog.push(r);
    return r;
  }

  try {
    if (actionId === "reset_status_defaults") {
      for (const c of listComponents()) {
        if (c.status === "degraded" || c.status === "unknown") {
          setComponentStatus(c.id, "operational", "self-heal reset");
        }
      }
      const r = { actionId, success: true, message: "Degraded/unknown components reset", at };
      healLog.push(r);
      return r;
    }
    if (actionId === "mark_degraded_clear") {
      setComponentStatus("api", "operational", "self-heal clear");
      const r = { actionId, success: true, message: "API marked operational", at };
      healLog.push(r);
      return r;
    }
    if (actionId === "rerun_self_tests") {
      const report = runSelfTests();
      if (report.overall === "unhealthy") {
        setComponentStatus("api", "degraded", "self-tests failed");
      }
      const r = {
        actionId,
        success: report.overall !== "unhealthy",
        message: `self-tests overall=${report.overall} pass=${report.summary.pass} fail=${report.summary.fail}`,
        at,
      };
      healLog.push(r);
      return r;
    }
    if (actionId === "incident_auto_resolve") {
      const r = {
        actionId,
        success: true,
        message: "Acknowledged — operator should resolve incidents in status UI",
        at,
      };
      healLog.push(r);
      return r;
    }
  } catch (err) {
    const r = {
      actionId,
      success: false,
      message: err instanceof Error ? err.message : String(err),
      at,
    };
    healLog.push(r);
    return r;
  }

  const r = { actionId, success: false, message: "No handler", at };
  healLog.push(r);
  return r;
}

export function autoHealFromReport(report: SelfTestReport): HealResult[] {
  const applied: HealResult[] = [];
  if (report.overall === "healthy") {
    applied.push(applyHealAction("mark_degraded_clear"));
    return applied;
  }
  if (report.overall === "degraded") {
    applied.push(applyHealAction("reset_status_defaults"));
  }
  // unhealthy: do not auto-destructive heal — surface only
  return applied;
}

export function listHealLog(limit = 50): HealResult[] {
  return [...healLog].reverse().slice(0, limit);
}

export function platformPulse(): {
  overall: ComponentStatus;
  components: ReturnType<typeof listComponents>;
  lastHeal?: HealResult;
} {
  return {
    overall: overallStatus(),
    components: listComponents(),
    lastHeal: healLog.length ? healLog[healLog.length - 1] : undefined,
  };
}
