/**
 * Usage metering + budget alerts
 * Tracks tokens, images, tool calls per org/user.
 */

export type MeterType = "tokens" | "images" | "video_seconds" | "tool_calls" | "seats" | "api_requests";

export interface MeterEvent {
  id: string;
  organizationId?: string;
  userId?: string;
  meter: MeterType;
  quantity: number;
  unit: string;
  costUsd: number;
  provider?: string;
  modelId?: string;
  createdAt: string;
}

export interface Budget {
  organizationId: string;
  monthlyLimitUsd: number;
  alertThreshold: number;
  currentSpendUsd: number;
  hardStop: boolean;
}

const events: MeterEvent[] = [];
const budgets = new Map<string, Budget>();

export function recordUsage(input: {
  organizationId?: string;
  userId?: string;
  meter: MeterType;
  quantity: number;
  costUsd?: number;
  provider?: string;
  modelId?: string;
}): MeterEvent | { blocked: true; reason: string } {
  const orgId = input.organizationId;
  if (orgId) {
    const budget = budgets.get(orgId);
    if (budget?.hardStop && budget.currentSpendUsd >= budget.monthlyLimitUsd) {
      return {
        blocked: true,
        reason: `Organization ${orgId} reached hard budget limit ($${budget.monthlyLimitUsd})`,
      };
    }
  }

  const event: MeterEvent = {
    id: `mtr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    organizationId: input.organizationId,
    userId: input.userId,
    meter: input.meter,
    quantity: input.quantity,
    unit: input.meter === "tokens" ? "tokens" : "count",
    costUsd: input.costUsd ?? 0,
    provider: input.provider,
    modelId: input.modelId,
    createdAt: new Date().toISOString(),
  };
  events.push(event);

  if (orgId && event.costUsd) {
    const budget = budgets.get(orgId);
    if (budget) {
      budget.currentSpendUsd += event.costUsd;
      budgets.set(orgId, budget);
    }
  }

  return event;
}

export function setBudget(input: {
  organizationId: string;
  monthlyLimitUsd: number;
  alertThreshold?: number;
  hardStop?: boolean;
}): Budget {
  const existing = budgets.get(input.organizationId);
  const budget: Budget = {
    organizationId: input.organizationId,
    monthlyLimitUsd: input.monthlyLimitUsd,
    alertThreshold: input.alertThreshold ?? 0.8,
    currentSpendUsd: existing?.currentSpendUsd ?? 0,
    hardStop: input.hardStop ?? false,
  };
  budgets.set(input.organizationId, budget);
  return budget;
}

export function getBudget(organizationId: string): Budget | undefined {
  return budgets.get(organizationId);
}

export function budgetStatus(organizationId: string): {
  budget?: Budget;
  ratio: number;
  alert: boolean;
  blocked: boolean;
} {
  const budget = budgets.get(organizationId);
  if (!budget || budget.monthlyLimitUsd <= 0) {
    return { budget, ratio: 0, alert: false, blocked: false };
  }
  const ratio = budget.currentSpendUsd / budget.monthlyLimitUsd;
  return {
    budget,
    ratio,
    alert: ratio >= budget.alertThreshold,
    blocked: budget.hardStop && ratio >= 1,
  };
}

export function summarizeUsage(filter?: {
  organizationId?: string;
  since?: string;
}): Record<MeterType | string, { quantity: number; costUsd: number }> {
  const since = filter?.since ? new Date(filter.since).getTime() : 0;
  const out: Record<string, { quantity: number; costUsd: number }> = {};
  for (const e of events) {
    if (filter?.organizationId && e.organizationId !== filter.organizationId) continue;
    if (new Date(e.createdAt).getTime() < since) continue;
    const slot = out[e.meter] ?? { quantity: 0, costUsd: 0 };
    slot.quantity += e.quantity;
    slot.costUsd += e.costUsd;
    out[e.meter] = slot;
  }
  return out;
}

export function estimateTokenCost(inputTokens: number, outputTokens: number, modelId?: string): number {
  // Rough public list prices — estimates only
  const rates: Record<string, { in: number; out: number }> = {
    default: { in: 2.5 / 1e6, out: 10 / 1e6 },
    "gpt-5.6-sol": { in: 5 / 1e6, out: 30 / 1e6 },
    "gpt-5.6-luna": { in: 1 / 1e6, out: 6 / 1e6 },
    "claude-opus-5": { in: 5 / 1e6, out: 25 / 1e6 },
  };
  const r = rates[modelId ?? ""] ?? rates.default!;
  return inputTokens * r.in + outputTokens * r.out;
}
