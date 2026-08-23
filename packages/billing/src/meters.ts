/**
 * packages/billing/src/attribution.ts already imported summarizeUsage from
 * "./meters" — this file didn't exist. Its signature is built to match that
 * existing call site (summarizeUsage({ organizationId, since })) exactly,
 * plus the additional exports apps/web/src/app/api/billing/route.ts needs.
 */

export type MeterType =
  | "tokens_input"
  | "tokens_output"
  | "image_generation"
  | "video_generation"
  | "api_call"
  | "storage_gb";

export interface UsageRecord {
  id: string;
  organizationId?: string;
  userId?: string;
  meter: MeterType;
  quantity: number;
  costUsd: number;
  provider?: string;
  modelId?: string;
  at: string;
}

export interface Budget {
  organizationId: string;
  monthlyLimitUsd: number;
  alertThreshold: number; // 0-1 fraction of limit
  hardStop: boolean;
}

export interface BudgetStatus {
  organizationId: string;
  monthlyLimitUsd: number;
  spentUsd: number;
  remainingUsd: number;
  percentUsed: number;
  alertTriggered: boolean;
  hardStop: boolean;
}

const usageRecords: UsageRecord[] = [];
const budgets = new Map<string, Budget>();

/** Rough per-million-token USD pricing. Not invoice-grade — see estimateTokenCost. */
const MODEL_PRICING: Record<string, { inputPerM: number; outputPerM: number }> = {
  "gpt-4o": { inputPerM: 2.5, outputPerM: 10 },
  "gpt-4o-mini": { inputPerM: 0.15, outputPerM: 0.6 },
  "claude-opus-4-8": { inputPerM: 15, outputPerM: 75 },
  "claude-sonnet-5": { inputPerM: 3, outputPerM: 15 },
  "claude-haiku-4-5-20251001": { inputPerM: 0.8, outputPerM: 4 },
  "gemini-2.5-pro": { inputPerM: 1.25, outputPerM: 5 },
  "gemini-2.5-flash": { inputPerM: 0.075, outputPerM: 0.3 },
};
const DEFAULT_PRICING = { inputPerM: 1, outputPerM: 3 };

export function estimateTokenCost(inputTokens: number, outputTokens: number, modelId?: string): number {
  const pricing = (modelId && MODEL_PRICING[modelId]) || DEFAULT_PRICING;
  return (inputTokens / 1_000_000) * pricing.inputPerM + (outputTokens / 1_000_000) * pricing.outputPerM;
}

export function setBudget(input: {
  organizationId: string;
  monthlyLimitUsd: number;
  alertThreshold?: number;
  hardStop?: boolean;
}): Budget {
  const budget: Budget = {
    organizationId: input.organizationId,
    monthlyLimitUsd: input.monthlyLimitUsd,
    alertThreshold: input.alertThreshold ?? 0.8,
    hardStop: input.hardStop ?? false,
  };
  budgets.set(input.organizationId, budget);
  return budget;
}

function monthlySpend(organizationId: string): number {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  return usageRecords
    .filter((r) => r.organizationId === organizationId && new Date(r.at).getTime() >= monthStart)
    .reduce((sum, r) => sum + r.costUsd, 0);
}

export function budgetStatus(organizationId: string): BudgetStatus | null {
  const budget = budgets.get(organizationId);
  if (!budget) return null;
  const spentUsd = monthlySpend(organizationId);
  const percentUsed = budget.monthlyLimitUsd > 0 ? spentUsd / budget.monthlyLimitUsd : 0;
  return {
    organizationId,
    monthlyLimitUsd: budget.monthlyLimitUsd,
    spentUsd,
    remainingUsd: Math.max(0, budget.monthlyLimitUsd - spentUsd),
    percentUsed,
    alertTriggered: percentUsed >= budget.alertThreshold,
    hardStop: budget.hardStop,
  };
}

export function recordUsage(input: {
  organizationId?: string;
  userId?: string;
  meter: MeterType;
  quantity: number;
  costUsd?: number;
  provider?: string;
  modelId?: string;
}): UsageRecord | { blocked: true; reason: string; status: BudgetStatus } {
  const costUsd = input.costUsd ?? 0;

  if (input.organizationId) {
    const budget = budgets.get(input.organizationId);
    if (budget?.hardStop) {
      const projected = monthlySpend(input.organizationId) + costUsd;
      if (projected > budget.monthlyLimitUsd) {
        return {
          blocked: true,
          reason: `Recording this usage would exceed the monthly budget of $${budget.monthlyLimitUsd}.`,
          status: budgetStatus(input.organizationId)!,
        };
      }
    }
  }

  const record: UsageRecord = {
    id: `usage_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    organizationId: input.organizationId,
    userId: input.userId,
    meter: input.meter,
    quantity: input.quantity,
    costUsd,
    provider: input.provider,
    modelId: input.modelId,
    at: new Date().toISOString(),
  };
  usageRecords.push(record);
  if (usageRecords.length > 20_000) usageRecords.shift();
  return record;
}

export function summarizeUsage(filter: { organizationId?: string; since?: string } = {}): Record<string, { quantity: number; costUsd: number }> {
  const sinceMs = filter.since ? new Date(filter.since).getTime() : 0;
  const records = usageRecords.filter((r) => {
    if (filter.organizationId && r.organizationId !== filter.organizationId) return false;
    if (new Date(r.at).getTime() < sinceMs) return false;
    return true;
  });
  const summary: Record<string, { quantity: number; costUsd: number }> = {};
  for (const r of records) {
    const bucket = summary[r.meter] ?? { quantity: 0, costUsd: 0 };
    bucket.quantity += r.quantity;
    bucket.costUsd += r.costUsd;
    summary[r.meter] = bucket;
  }
  return summary;
}
