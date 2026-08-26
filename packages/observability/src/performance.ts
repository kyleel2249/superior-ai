/**
 * Performance budgets, pagination, concurrency limits, scale guidance.
 */

export interface PerformanceBudget {
  id: string;
  name: string;
  targetMs: number;
  hardMaxMs: number;
  notes: string;
}

export const DEFAULT_BUDGETS: PerformanceBudget[] = [
  {
    id: "api_health",
    name: "GET /api/health",
    targetMs: 50,
    hardMaxMs: 500,
    notes: "Should stay local-data only",
  },
  {
    id: "api_chat_first_token",
    name: "Chat first token",
    targetMs: 1500,
    hardMaxMs: 8000,
    notes: "Depends on provider latency",
  },
  {
    id: "memory_retrieve",
    name: "Memory retrieve",
    targetMs: 100,
    hardMaxMs: 2000,
    notes: "In-memory fast; pgvector varies",
  },
  {
    id: "page_command",
    name: "Command center interactive",
    targetMs: 200,
    hardMaxMs: 3000,
    notes: "Client render + parallel fetches",
  },
];

export interface TimingSample {
  budgetId: string;
  durationMs: number;
  at: string;
  ok: boolean;
}

const samples: TimingSample[] = [];

export function recordTiming(budgetId: string, durationMs: number): TimingSample {
  const budget = DEFAULT_BUDGETS.find((b) => b.id === budgetId);
  const sample: TimingSample = {
    budgetId,
    durationMs,
    at: new Date().toISOString(),
    ok: budget ? durationMs <= budget.hardMaxMs : true,
  };
  samples.push(sample);
  if (samples.length > 2000) samples.shift();
  return sample;
}

export function timingSummary(budgetId?: string): Array<{
  budgetId: string;
  count: number;
  avgMs: number;
  p95Ms: number;
  okRate: number;
}> {
  const ids = budgetId
    ? [budgetId]
    : [...new Set(samples.map((s) => s.budgetId))];
  return ids.map((id) => {
    const rows = samples.filter((s) => s.budgetId === id).map((s) => s.durationMs);
    const sorted = [...rows].sort((a, b) => a - b);
    const avg = rows.length ? rows.reduce((a, b) => a + b, 0) / rows.length : 0;
    const p95 = sorted.length
      ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))]!
      : 0;
    const ok = samples.filter((s) => s.budgetId === id && s.ok).length;
    return {
      budgetId: id,
      count: rows.length,
      avgMs: Math.round(avg),
      p95Ms: Math.round(p95),
      okRate: rows.length ? ok / rows.length : 1,
    };
  });
}

export function paginate<T>(
  items: T[],
  page = 1,
  pageSize = 20
): {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
} {
  const size = Math.min(100, Math.max(1, pageSize));
  const p = Math.max(1, page);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const start = (p - 1) * size;
  const slice = items.slice(start, start + size);
  return {
    items: slice,
    page: p,
    pageSize: size,
    total,
    totalPages,
    hasMore: p < totalPages,
  };
}

/** Simple concurrency gate for fan-out work */
export async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const limit = Math.max(1, Math.min(32, concurrency));
  const results: R[] = new Array(items.length);
  let idx = 0;

  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await fn(items[i]!, i);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

export function scaleChecklist(): Array<{ area: string; guidance: string; status: string }> {
  return [
    {
      area: "App instances",
      guidance: "Horizontal scale Next.js behind a load balancer; sticky sessions not required for JWT",
      status: "ready",
    },
    {
      area: "Cache",
      guidance: "Use Redis when multi-instance; in-memory is single-node only",
      status: "adapter_ready",
    },
    {
      area: "Queue",
      guidance: "BullMQ + Redis for durable jobs; in-memory for local",
      status: "adapter_ready",
    },
    {
      area: "Database",
      guidance: "Postgres pool size via connection string; pgvector for RAG",
      status: "config",
    },
    {
      area: "AI gateway",
      guidance: "Provider failover + rate limits; cache embeddings",
      status: "ready",
    },
    {
      area: "Rate limits",
      guidance: "Edge middleware + Redis rate limit for multi-node",
      status: "ready",
    },
    {
      area: "Code exec",
      guidance: "Dedicated worker pool; gVisor when available",
      status: "documented",
    },
  ];
}

export function withTiming<T>(budgetId: string, fn: () => T): T {
  const t0 = Date.now();
  try {
    return fn();
  } finally {
    recordTiming(budgetId, Date.now() - t0);
  }
}

export async function withTimingAsync<T>(budgetId: string, fn: () => Promise<T>): Promise<T> {
  const t0 = Date.now();
  try {
    return await fn();
  } finally {
    recordTiming(budgetId, Date.now() - t0);
  }
}
