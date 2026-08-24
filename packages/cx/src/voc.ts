/**
 * Voice of Customer — themes from tickets, feedback, reviews (provided text only).
 */

export interface VocTheme {
  theme: string;
  count: number;
  sentiment: "positive" | "negative" | "mixed" | "neutral";
  examples: string[];
  productImplication?: string;
  marketingImplication?: string;
}

export interface VocReport {
  sampleSize: number;
  themes: VocTheme[];
  npsShell: { score: number | null; note: string };
  csatShell: { score: number | null; note: string };
  retentionRisks: string[];
  opportunities: string[];
  provenance: string;
}

const THEME_RULES: Array<{ re: RegExp; theme: string; sentiment: VocTheme["sentiment"] }> = [
  { re: /price|expensive|cost|billing/i, theme: "pricing", sentiment: "negative" },
  { re: /bug|broken|error|crash|fail/i, theme: "reliability", sentiment: "negative" },
  { re: /slow|latency|performance/i, theme: "performance", sentiment: "negative" },
  { re: /support|response|help desk/i, theme: "support experience", sentiment: "mixed" },
  { re: /easy|simple|love|great|helpful/i, theme: "ease of use", sentiment: "positive" },
  { re: /onboard|setup|getting started/i, theme: "onboarding", sentiment: "mixed" },
  { re: /feature request|wish|missing|need/i, theme: "feature gaps", sentiment: "neutral" },
  { re: /integrat/i, theme: "integrations", sentiment: "mixed" },
];

export function analyzeVoc(texts: string[]): VocReport {
  const buckets = new Map<string, VocTheme>();
  for (const raw of texts) {
    const text = raw.trim();
    if (!text) continue;
    let matched = false;
    for (const rule of THEME_RULES) {
      if (rule.re.test(text)) {
        matched = true;
        const cur = buckets.get(rule.theme) ?? {
          theme: rule.theme,
          count: 0,
          sentiment: rule.sentiment,
          examples: [],
        };
        cur.count += 1;
        if (cur.examples.length < 3) cur.examples.push(text.slice(0, 160));
        buckets.set(rule.theme, cur);
      }
    }
    if (!matched) {
      const cur = buckets.get("general") ?? {
        theme: "general",
        count: 0,
        sentiment: "neutral" as const,
        examples: [],
      };
      cur.count += 1;
      if (cur.examples.length < 3) cur.examples.push(text.slice(0, 160));
      buckets.set("general", cur);
    }
  }

  const themes = [...buckets.values()]
    .map((t) => ({
      ...t,
      productImplication:
        t.theme === "feature gaps"
          ? "Prioritize roadmap discovery interviews"
          : t.theme === "reliability"
            ? "Escalate to engineering quality"
            : undefined,
      marketingImplication:
        t.theme === "ease of use"
          ? "Amplify in messaging and testimonials"
          : t.theme === "pricing"
            ? "Review packaging clarity"
            : undefined,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    sampleSize: texts.filter((t) => t.trim()).length,
    themes,
    npsShell: {
      score: null,
      note: "NPS requires surveyed responses — not inferred from free text alone.",
    },
    csatShell: {
      score: null,
      note: "CSAT requires rated tickets/surveys — not fabricated.",
    },
    retentionRisks: themes
      .filter((t) => t.sentiment === "negative" && t.count >= 1)
      .map((t) => `Theme "${t.theme}" appearing in feedback`),
    opportunities: themes
      .filter((t) => t.sentiment === "positive")
      .map((t) => `Lean into strength: ${t.theme}`),
    provenance: "Themes from provided text only. Scores null until survey instrumentation exists.",
  };
}

export function retentionPlaybook(product: string): {
  stages: Array<{ name: string; actions: string[] }>;
  note: string;
} {
  return {
    stages: [
      {
        name: "Activation",
        actions: [`Ensure first value with ${product} in <7 days`, "Onboarding checklist", "Success milestone email"],
      },
      {
        name: "Adoption",
        actions: ["Usage nudges", "Feature education", "Health score if data available"],
      },
      {
        name: "Expansion",
        actions: ["Identify power users", "Offer adjacent value only when true"],
      },
      {
        name: "Save",
        actions: ["Churn signals → outreach", "Root-cause capture", "Fair win-back without dark patterns"],
      },
    ],
    note: "Playbook is operational guidance. Metrics require product analytics connection.",
  };
}
