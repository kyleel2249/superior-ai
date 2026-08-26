/**
 * AI Business Digital Twin — internal company representation for simulation.
 * Outputs are estimates, not guaranteed outcomes.
 */

export interface TwinSnapshot {
  id: string;
  name: string;
  updatedAt: string;
  products: Array<{ id: string; name: string; mrr?: number; users?: number }>;
  revenue: { monthly?: number; annual?: number; currency: string };
  costs: { monthly?: number; currency: string };
  employees: number;
  departments: string[];
  customers: { active?: number; churnRate?: number };
  pipeline: { deals?: number; value?: number };
  inventory?: { skus?: number; stockouts?: number };
  kpis: Record<string, number | string>;
  risks: string[];
  competitors: string[];
  goals: string[];
  assumptions: string[];
}

export interface TwinDelta {
  pricingChangePct?: number;
  marketingSpendDelta?: number;
  hiringDelta?: number;
  churnDeltaPct?: number;
  costReductionPct?: number;
  newProductMrr?: number;
}

export interface TwinSimulationResult {
  twinId: string;
  baseline: TwinSnapshot;
  projected: {
    monthlyRevenue?: number;
    monthlyCosts?: number;
    net?: number;
    activeCustomers?: number;
    notes: string[];
  };
  disclaimer: string;
  at: string;
}

const twins = new Map<string, TwinSnapshot>();

export function upsertTwin(
  input: Partial<TwinSnapshot> & { name: string }
): TwinSnapshot {
  const id = input.id ?? `twin_${Date.now().toString(36)}`;
  const existing = twins.get(id);
  const snap: TwinSnapshot = {
    id,
    name: input.name,
    updatedAt: new Date().toISOString(),
    products: input.products ?? existing?.products ?? [],
    revenue: input.revenue ?? existing?.revenue ?? { currency: "USD" },
    costs: input.costs ?? existing?.costs ?? { currency: "USD" },
    employees: input.employees ?? existing?.employees ?? 0,
    departments: input.departments ?? existing?.departments ?? [],
    customers: input.customers ?? existing?.customers ?? {},
    pipeline: input.pipeline ?? existing?.pipeline ?? {},
    inventory: input.inventory ?? existing?.inventory,
    kpis: input.kpis ?? existing?.kpis ?? {},
    risks: input.risks ?? existing?.risks ?? [],
    competitors: input.competitors ?? existing?.competitors ?? [],
    goals: input.goals ?? existing?.goals ?? [],
    assumptions: input.assumptions ?? existing?.assumptions ?? [],
  };
  twins.set(id, snap);
  return snap;
}

export function getTwin(id: string): TwinSnapshot | undefined {
  return twins.get(id);
}

export function listTwins(): TwinSnapshot[] {
  return [...twins.values()];
}

/** Deterministic linear sensitivity (fixed coefficients). Same inputs → same outputs. */
const FIXED_COEFFICIENTS = { marketingCustomerPerDollar: 1 / 50, hireMonthlyCost: 5000 } as const;

/** Deterministic projection */
export function simulateTwin(twinId: string, delta: TwinDelta): TwinSimulationResult {
  const baseline = twins.get(twinId);
  if (!baseline) {
    throw new Error(`Twin not found: ${twinId}`);
  }
  const notes: string[] = [];
  let monthlyRevenue = baseline.revenue.monthly ?? 0;
  let monthlyCosts = baseline.costs.monthly ?? 0;
  let activeCustomers = baseline.customers.active ?? 0;

  if (delta.pricingChangePct != null) {
    monthlyRevenue *= 1 + delta.pricingChangePct / 100;
    notes.push(`Applied pricing change ${delta.pricingChangePct}%`);
  }
  if (delta.marketingSpendDelta != null) {
    monthlyCosts += delta.marketingSpendDelta;
    // naive elasticity
    activeCustomers += Math.round(delta.marketingSpendDelta * FIXED_COEFFICIENTS.marketingCustomerPerDollar);
    notes.push(`Marketing spend delta ${delta.marketingSpendDelta}`);
  }
  if (delta.hiringDelta != null) {
    monthlyCosts += delta.hiringDelta * FIXED_COEFFICIENTS.hireMonthlyCost;
    notes.push(`Hiring delta ${delta.hiringDelta} @ $${FIXED_COEFFICIENTS.hireMonthlyCost}/mo (fixed coefficient)`);
  }
  if (delta.churnDeltaPct != null && activeCustomers) {
    activeCustomers = Math.max(
      0,
      Math.round(activeCustomers * (1 - delta.churnDeltaPct / 100))
    );
    notes.push(`Churn delta ${delta.churnDeltaPct}%`);
  }
  if (delta.costReductionPct != null) {
    monthlyCosts *= 1 - delta.costReductionPct / 100;
    notes.push(`Cost reduction ${delta.costReductionPct}%`);
  }
  if (delta.newProductMrr != null) {
    monthlyRevenue += delta.newProductMrr;
    notes.push(`New product MRR +${delta.newProductMrr}`);
  }

  return {
    twinId,
    baseline,
    projected: {
      monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
      monthlyCosts: Math.round(monthlyCosts * 100) / 100,
      net: Math.round((monthlyRevenue - monthlyCosts) * 100) / 100,
      activeCustomers,
      notes,
    },
    disclaimer:
      "Deterministic projection from supplied inputs and fixed coefficients. Same inputs always yield the same outputs. Not a real-world outcome guarantee or financial advice.",
    at: new Date().toISOString(),
  };
}
