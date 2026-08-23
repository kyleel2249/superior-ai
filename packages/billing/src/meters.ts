export type MeterType = "tokens" | "requests" | "storage_mb" | "code_exec" | "image_gen" | "video_gen";

export interface UsageRecord {
  organizationId: string;
  userId?: string;
  meter: MeterType;
  quantity: number;
  costUsd?: number;
  provider?: string;
  modelId?: string;
  at: string;
}

export interface Budget {
  organizationId: string;
  monthlyLimitUsd: number;
  alertThreshold?: number; // 0-1 fraction of limit
  hardStop?: boolean;
  updatedAt: string;
}

const usage: UsageRecord[] = [];
const budgets = new Map<string, Budget>();

// Rough per-1M-token USD estimates for common tiers, used only for the /estimate
// endpoint's advisory number — actual billed cost always comes from OpenRouter's
// real response `usage` + pricing, not this table.
const FALLBACK_RATE_PER_1M = { input: 3, output: 15 };

export function estimateTokenCost(inputTokens: number, outputTokens: number, _modelId?: string): number {
  const cost = (inputTokens / 1_000_000) * FALLBACK_RATE_PER_1M.input + (outputTokens / 1_000_000) * FALLBACK_RATE_PER_1M.output;
  return Math.round(cost * 1_000_000) / 1_000_000;
}

export function setBudget(input: { organizationId: string; monthlyLimitUsd: number; alertThreshold?: number; hardStop?: boolean }): Budget {
  const budget: Budget = {
    organizationId: input.organizationId,
    monthlyLimitUsd: input.monthlyLimitUsd,
    alertThreshold: input.alertThreshold ?? 0.8,
    hardStop: input.hardStop ?? false,
    updatedAt: new Date().toISOString(),
  };
  budgets.set(input.organizationId, budget);
  return budget;
}

function monthToDateSpend(organizationId: string): number {
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  return usage
    .filter((u) => u.organizationId === organizationId && new Date(u.at) >= monthStart)
    .reduce((sum, u) => sum + (u.costUsd ?? 0), 0);
}

export function budgetStatus(organizationId: string) {
  const budget = budgets.get(organizationId);
  const spentUsd = monthToDateSpend(organizationId);
  if (!budget) return { organizationId, spentUsd, budgetSet: false as const };
  const ratio = budget.monthlyLimitUsd > 0 ? spentUsd / budget.monthlyLimitUsd : 0;
  return {
    organizationId,
    budgetSet: true as const,
    monthlyLimitUsd: budget.monthlyLimitUsd,
    spentUsd,
    ratio,
    overAlertThreshold: ratio >= (budget.alertThreshold ?? 0.8),
    overLimit: ratio >= 1,
    hardStop: budget.hardStop ?? false,
  };
}

export function recordUsage(input: {
  organizationId: string;
  userId?: string;
  meter: MeterType;
  quantity: number;
  costUsd?: number;
  provider?: string;
  modelId?: string;
}): UsageRecord | { blocked: true; reason: string } {
  const status = budgetStatus(input.organizationId);
  if (status.budgetSet && status.overLimit && status.hardStop) {
    return { blocked: true, reason: `Monthly budget of $${status.monthlyLimitUsd} exceeded (hard stop enabled).` };
  }
  const record: UsageRecord = { ...input, at: new Date().toISOString() };
  usage.push(record);
  if (usage.length > 20_000) usage.shift();
  return record;
}

export function summarizeUsage(filter: { organizationId?: string; since?: string } = {}): Record<string, { quantity: number; costUsd: number }> {
  const sinceMs = filter.since ? new Date(filter.since).getTime() : 0;
  const out: Record<string, { quantity: number; costUsd: number }> = {};
  for (const u of usage) {
    if (filter.organizationId && u.organizationId !== filter.organizationId) continue;
    if (new Date(u.at).getTime() < sinceMs) continue;
    const bucket = out[u.meter] ?? { quantity: 0, costUsd: 0 };
    bucket.quantity += u.quantity;
    bucket.costUsd += u.costUsd ?? 0;
    out[u.meter] = bucket;
  }
  return out;
}
