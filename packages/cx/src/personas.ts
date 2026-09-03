/** Dynamic customer persona factory */

export interface CustomerPersona {
  id: string;
  name: string;
  segment: string;
  problem: string;
  goal: string;
  pain: string;
  motivation: string;
  objection: string;
  buyingTrigger: string;
  preferredChannel: string;
  preferredContent: string;
  decisionCriteria: string;
  expectedLtv: string;
  retentionRisk: string;
  geography?: string;
  industry?: string;
  companySize?: string;
  evolvedFrom?: string;
  createdAt: string;
  updatedAt: string;
}

const personas: CustomerPersona[] = [];

export function createPersona(input: Partial<CustomerPersona> & { segment: string; problem: string }): CustomerPersona {
  const id = `persona_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const p: CustomerPersona = {
    id,
    name: input.name ?? `Persona ${personas.length + 1}`,
    segment: input.segment,
    problem: input.problem,
    goal: input.goal ?? "Solve the stated problem efficiently",
    pain: input.pain ?? input.problem,
    motivation: input.motivation ?? "Reduce friction and risk",
    objection: input.objection ?? "Price / trust / complexity",
    buyingTrigger: input.buyingTrigger ?? "Clear ROI demonstration",
    preferredChannel: input.preferredChannel ?? "web + email",
    preferredContent: input.preferredContent ?? "case studies and demos",
    decisionCriteria: input.decisionCriteria ?? "value, reliability, support",
    expectedLtv: input.expectedLtv ?? "estimate pending data",
    retentionRisk: input.retentionRisk ?? "medium until product-market fit signals",
    geography: input.geography,
    industry: input.industry,
    companySize: input.companySize,
    evolvedFrom: input.evolvedFrom,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  personas.push(p);
  return p;
}

export function listPersonas(): CustomerPersona[] {
  return [...personas];
}

export function evolvePersona(id: string, patch: Partial<CustomerPersona>): CustomerPersona | null {
  const p = personas.find((x) => x.id === id);
  if (!p) return null;
  Object.assign(p, patch, { updatedAt: new Date().toISOString(), evolvedFrom: p.id });
  return p;
}
