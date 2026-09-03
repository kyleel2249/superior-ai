/**
 * Product idea → marketable product pipeline + validation scores
 * Scores are analytical estimates, not guarantees.
 */

export interface ProductConcept {
  id: string;
  idea: string;
  customerProblem: string;
  targetMarket: string;
  valueProposition: string;
  solution: string;
  productDefinition: string;
  mvp: string[];
  features: string[];
  pricing: string;
  positioning: string;
  brandingNotes: string;
  scores: {
    opportunity: number;
    demand: number;
    competition: number;
    revenuePotential: number;
    executionDifficulty: number;
    risk: number;
  };
  disclaimer: string;
  createdAt: string;
}

const concepts: ProductConcept[] = [];

export function developConcept(input: {
  idea: string;
  customerProblem?: string;
  targetMarket?: string;
}): ProductConcept {
  const idea = input.idea.trim();
  const problem = input.customerProblem ?? `Unresolved need related to: ${idea}`;
  const market = input.targetMarket ?? "to be refined with market research";

  // Heuristic scores — explicit estimates
  const opportunity = 55 + Math.min(25, idea.length % 30);
  const demand = 50 + (problem.length > 40 ? 15 : 5);
  const competition = 40 + (idea.toLowerCase().includes("ai") ? 20 : 10);
  const revenuePotential = Math.round((opportunity + demand) / 2);
  const executionDifficulty = 45 + (idea.toLowerCase().includes("platform") ? 20 : 10);
  const risk = Math.round((competition + executionDifficulty) / 2);

  const concept: ProductConcept = {
    id: `prod_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    idea,
    customerProblem: problem,
    targetMarket: market,
    valueProposition: `Help ${market} solve "${problem}" with ${idea}`,
    solution: `A focused solution delivering ${idea} for the stated problem`,
    productDefinition: `MVP product centered on the core workflow of ${idea}`,
    mvp: [
      "Core user journey end-to-end",
      "Minimal admin / settings",
      "Analytics on activation",
      "Support documentation",
    ],
    features: ["Primary workflow", "Integrations later", "Reporting"],
    pricing: "Validate willingness-to-pay; start with simple tier + pilot",
    positioning: `Category alternative emphasizing speed-to-value for ${market}`,
    brandingNotes: "Clear, trustworthy, problem-led naming",
    scores: {
      opportunity,
      demand,
      competition,
      revenuePotential,
      executionDifficulty,
      risk,
    },
    disclaimer:
      "Scores are analytical estimates for decision support, not guarantees or regulated investment advice.",
    createdAt: new Date().toISOString(),
  };
  concepts.push(concept);
  return concept;
}

export function listConcepts(): ProductConcept[] {
  return [...concepts].reverse();
}

export function investmentCases(conceptId: string): {
  bull: string;
  base: string;
  bear: string;
  keyRisks: string[];
  keyAssumptions: string[];
  recommendation: string;
  disclaimer: string;
} | null {
  const c = concepts.find((x) => x.id === conceptId);
  if (!c) return null;
  return {
    bull: `Strong demand realization; ${c.scores.revenuePotential}+ revenue potential if distribution works.`,
    base: `Moderate adoption; execute MVP and validate pricing with early customers.`,
    bear: `Competition and acquisition cost exceed returns; pivot or stop after pilot.`,
    keyRisks: [
      "Customer acquisition cost higher than expected",
      "Execution delay",
      "Competitor response",
      "Pricing power weaker than assumed",
    ],
    keyAssumptions: [
      "Problem is urgent for target segment",
      "MVP can be shipped with available capacity",
      "Channel access exists or can be built",
    ],
    recommendation:
      c.scores.opportunity >= 60 && c.scores.risk < 70
        ? "Proceed to validated pilot with clear kill criteria"
        : "Research further before material build investment",
    disclaimer:
      "Decision-support analysis only. Not investment, legal, or financial advice.",
  };
}
