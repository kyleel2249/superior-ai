/** Customer journey map + CX friction analysis */

export type JourneyStage =
  | "awareness"
  | "interest"
  | "evaluation"
  | "purchase"
  | "onboarding"
  | "usage"
  | "support"
  | "retention"
  | "advocacy";

export interface JourneyStageDetail {
  stage: JourneyStage;
  customerQuestion: string;
  emotion: string;
  customerGoal: string;
  businessObjective: string;
  friction: string[];
  recommendedActions: string[];
}

export function buildJourney(input: {
  product: string;
  persona?: string;
  industry?: string;
}): JourneyStageDetail[] {
  const product = input.product;
  return [
    {
      stage: "awareness",
      customerQuestion: `What is ${product} and why should I care?`,
      emotion: "curious / skeptical",
      customerGoal: "Discover whether this solves a real pain",
      businessObjective: "Reach target segment with credible message",
      friction: ["unclear value prop", "weak SEO", "low trust signals"],
      recommendedActions: ["problem-led content", "social proof", "SEO topic clusters"],
    },
    {
      stage: "interest",
      customerQuestion: "How does this compare to alternatives?",
      emotion: "interested",
      customerGoal: "Shortlist viable options",
      businessObjective: "Capture lead / depth engagement",
      friction: ["generic messaging", "no demo"],
      recommendedActions: ["comparison guide", "interactive demo", "case study"],
    },
    {
      stage: "evaluation",
      customerQuestion: "Will this work for my context?",
      emotion: "analytical",
      customerGoal: "Reduce purchase risk",
      businessObjective: "Win evaluation",
      friction: ["missing ROI model", "complex pricing"],
      recommendedActions: ["ROI calculator", "pilot offer", "security one-pager"],
    },
    {
      stage: "purchase",
      customerQuestion: "How do I buy and start?",
      emotion: "committed but cautious",
      customerGoal: "Complete purchase smoothly",
      businessObjective: "Convert",
      friction: ["checkout friction", "unclear next step"],
      recommendedActions: ["streamlined checkout", "clear SLA", "welcome sequence"],
    },
    {
      stage: "onboarding",
      customerQuestion: "How do I get value in the first week?",
      emotion: "hopeful / overwhelmed",
      customerGoal: "First success",
      businessObjective: "Activation",
      friction: ["empty states", "too many steps"],
      recommendedActions: ["guided setup", "templates", "success checklist"],
    },
    {
      stage: "usage",
      customerQuestion: "Am I getting ongoing value?",
      emotion: "pragmatic",
      customerGoal: "Routine outcomes",
      businessObjective: "Engagement / expansion",
      friction: ["feature discovery gaps"],
      recommendedActions: ["in-product tips", "use-case library"],
    },
    {
      stage: "support",
      customerQuestion: "Can someone fix this quickly?",
      emotion: "frustrated or uncertain",
      customerGoal: "Resolution",
      businessObjective: "Restore trust",
      friction: ["repetitive questions", "slow replies"],
      recommendedActions: ["context-aware support", "KB articles from tickets"],
    },
    {
      stage: "retention",
      customerQuestion: "Should I renew / stay?",
      emotion: "evaluative",
      customerGoal: "Confirm continued fit",
      businessObjective: "Renewal",
      friction: ["unseen value", "price shock"],
      recommendedActions: ["value reports", "success reviews"],
    },
    {
      stage: "advocacy",
      customerQuestion: "Would I recommend this?",
      emotion: "proud / neutral",
      customerGoal: "Share if delighted",
      businessObjective: "Referrals",
      friction: ["no easy share path"],
      recommendedActions: ["referral program", "review prompts"],
    },
  ];
}

export function cxHealthScore(journey: JourneyStageDetail[]): {
  score: number;
  topFrictions: string[];
  priorities: string[];
} {
  const frictions = journey.flatMap((s) => s.friction.map((f) => `${s.stage}: ${f}`));
  const score = Math.max(20, 100 - frictions.length * 6);
  return {
    score,
    topFrictions: frictions.slice(0, 8),
    priorities: journey.flatMap((s) => s.recommendedActions).slice(0, 8),
  };
}
