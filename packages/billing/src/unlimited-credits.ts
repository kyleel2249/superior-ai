/**
 * CINTEXA / SUPERIOR internal credits & token accounting
 * UNLIMITED — never block users on internal ledger.
 * Track usage for analytics only. External provider limits handled via routing.
 */

export const SUPERIOR_INTERNAL_CREDITS = "UNLIMITED" as const;
export const SUPERIOR_INTERNAL_TOKEN_ACCOUNTING = "UNLIMITED" as const;
export const CINTEXA_INTERNAL_CREDITS = "UNLIMITED" as const;
export const CINTEXA_INTERNAL_TOKEN_ACCOUNTING = "UNLIMITED" as const;

export interface UsageLedgerEntry {
  id: string;
  at: string;
  organizationId?: string;
  userId?: string;
  modelId?: string;
  provider?: string;
  inputTokens?: number;
  outputTokens?: number;
  reasoningTokens?: number;
  estimatedCostUsd?: number;
  taskType?: string;
  note?: string;
}

const ledger: UsageLedgerEntry[] = [];

export function recordUsageAccounting(entry: Omit<UsageLedgerEntry, "id" | "at">): UsageLedgerEntry {
  const row: UsageLedgerEntry = {
    ...entry,
    id: `ul_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    at: new Date().toISOString(),
  };
  ledger.push(row);
  if (ledger.length > 10_000) ledger.shift();
  return row;
}

export function listUsageAccounting(limit = 100): UsageLedgerEntry[] {
  return [...ledger].reverse().slice(0, limit);
}

/** Always allow — internal credits never block */
export function assertCreditsAvailable(_estimated?: number): {
  allowed: true;
  internalCredits: typeof SUPERIOR_INTERNAL_CREDITS;
  message: string;
} {
  return {
    allowed: true,
    internalCredits: SUPERIOR_INTERNAL_CREDITS,
    message:
      "Internal CINTEXA/SUPERIOR credits are unlimited. External provider quotas may still apply and are handled via routing/fallback.",
  };
}

export function creditPolicy(): {
  internalCredits: "UNLIMITED";
  internalTokens: "UNLIMITED";
  blocksUserOnInternalExhaustion: false;
  tracksProviderCost: true;
} {
  return {
    internalCredits: "UNLIMITED",
    internalTokens: "UNLIMITED",
    blocksUserOnInternalExhaustion: false,
    tracksProviderCost: true,
  };
}
