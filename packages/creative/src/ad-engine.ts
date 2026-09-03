/**
 * Advertising & Story Engine — hooks, CTAs, multi-length ads, story types.
 */

export type StoryType =
  | "problem"
  | "customer"
  | "founder"
  | "transformation"
  | "humorous"
  | "educational"
  | "emotional";

export type AdDurationSec = 10 | 15 | 20 | 30 | 45 | 60 | 90;

export interface HookSet {
  storyType: StoryType;
  hooks: string[];
}

export interface CtaSet {
  ctas: string[];
}

export interface AdVariant {
  id: string;
  durationSec: AdDurationSec;
  storyType: StoryType;
  hook: string;
  body: string[];
  cta: string;
  script: string;
  beats: Array<{ atSec: number; line: string }>;
}

export interface AdCampaignCreative {
  product: string;
  audience: string;
  storyType: StoryType;
  hooks: string[];
  ctas: string[];
  variants: AdVariant[];
  skits: Array<{ title: string; beats: string[] }>;
  note: string;
}

const HOOK_BANK: Record<StoryType, string[]> = {
  problem: [
    "Stop losing leads to messy follow-ups.",
    "What if your CRM actually worked for you?",
    "This is the problem nobody schedules time for.",
  ],
  customer: [
    "I switched last month — here's what changed.",
    "A customer said this after week one…",
    "Real story from a team like yours.",
  ],
  founder: [
    "We built this because we lived the pain.",
    "Founder note: why we refused the easy feature.",
    "The day we almost quit — then shipped this.",
  ],
  transformation: [
    "From chaos to a clean pipeline in 14 days.",
    "Before / after: same team, different system.",
    "Watch the shift when follow-ups run themselves.",
  ],
  humorous: [
    "My spreadsheet has trust issues.",
    "POV: you promised to 'update the CRM later.'",
    "If sticky notes counted as a sales strategy…",
  ],
  educational: [
    "Three reasons deals stall after the demo.",
    "Quick lesson: speed-to-lead still wins.",
    "Here's the follow-up sequence that compounds.",
  ],
  emotional: [
    "You didn't start a business to chase reminders.",
    "Remember the last deal that slipped away?",
    "Peace of mind is a pipeline you can trust.",
  ],
};

const CTA_BANK = [
  "Book a demo",
  "Start free",
  "See how it works",
  "Get the checklist",
  "Join the waitlist",
  "Talk to sales",
  "Try it today",
];

export function generateHooks(storyType: StoryType, product: string, audience: string): HookSet {
  const base = HOOK_BANK[storyType] ?? HOOK_BANK.problem;
  const hooks = [
    ...base,
    `${product} for ${audience} — without the busywork.`,
    `If you're ${audience}, this ${product} moment is for you.`,
  ];
  return { storyType, hooks };
}

export function generateCtas(product?: string): CtaSet {
  const ctas = [...CTA_BANK];
  if (product) ctas.unshift(`Try ${product}`);
  return { ctas };
}

function beatsForDuration(duration: AdDurationSec, parts: string[]): Array<{ atSec: number; line: string }> {
  const n = parts.length;
  const step = duration / n;
  return parts.map((line, i) => ({
    atSec: Math.round(i * step * 10) / 10,
    line,
  }));
}

export function generateAdVariant(input: {
  product: string;
  audience: string;
  storyType: StoryType;
  durationSec: AdDurationSec;
  hook?: string;
  cta?: string;
  painPoint?: string;
}): AdVariant {
  const hooks = generateHooks(input.storyType, input.product, input.audience).hooks;
  const ctas = generateCtas(input.product).ctas;
  const hook = input.hook ?? hooks[0]!;
  const cta = input.cta ?? ctas[0]!;
  const pain = input.painPoint ?? "manual follow-ups";

  const bodyByType: Record<StoryType, string[]> = {
    problem: [
      `${input.audience} still fight ${pain}.`,
      `${input.product} removes the busywork.`,
    ],
    customer: [
      `Teams like yours used to juggle ${pain}.`,
      `With ${input.product}, the day feels lighter.`,
    ],
    founder: [
      `We built ${input.product} after living ${pain}.`,
      `Every feature starts from that scar.`,
    ],
    transformation: [
      `Before: ${pain}.`,
      `After: a pipeline you can trust with ${input.product}.`,
    ],
    humorous: [
      `${pain} is not a personality trait.`,
      `${input.product} is the punchline that actually helps.`,
    ],
    educational: [
      `Lesson: speed and clarity beat more tools.`,
      `${input.product} operationalizes that lesson.`,
    ],
    emotional: [
      `You deserve work that doesn't haunt evenings.`,
      `${input.product} gives ${input.audience} room to breathe.`,
    ],
  };

  let body = bodyByType[input.storyType];
  // Fit length: shorter ads → fewer lines
  if (input.durationSec <= 15) body = body.slice(0, 1);
  if (input.durationSec >= 60) {
    body = [...body, `Built for ${input.audience}.`, `Simple to start, serious about results.`];
  }

  const parts = [hook, ...body, cta];
  const script = parts.join(" ");
  const beats = beatsForDuration(input.durationSec, parts);

  return {
    id: `ad_${input.storyType}_${input.durationSec}_${Date.now().toString(36).slice(-4)}_${Math.random().toString(36).slice(2, 6)}`,
    durationSec: input.durationSec,
    storyType: input.storyType,
    hook,
    body,
    cta,
    script,
    beats,
  };
}

export function generateAdSkit(input: {
  product: string;
  audience: string;
  storyType?: StoryType;
}): { title: string; beats: string[] } {
  const type = input.storyType ?? "humorous";
  return {
    title: `${input.product} skit · ${type}`,
    beats: [
      `Cold open: ${input.audience} drowning in reminders.`,
      `Interruption: colleague suggests ${input.product}.`,
      `Quick win on screen.`,
      `Tag: ${input.product} — less chaos, more closes.`,
    ],
  };
}

const DURATIONS: AdDurationSec[] = [10, 15, 20, 30, 45, 60, 90];

export function generateAdCampaignCreative(input: {
  product: string;
  audience: string;
  storyType?: StoryType;
  painPoint?: string;
  durations?: AdDurationSec[];
}): AdCampaignCreative {
  const storyType = input.storyType ?? "problem";
  const hooks = generateHooks(storyType, input.product, input.audience).hooks;
  const ctas = generateCtas(input.product).ctas;
  const durations = input.durations ?? DURATIONS;
  const variants = durations.map((durationSec, i) =>
    generateAdVariant({
      product: input.product,
      audience: input.audience,
      storyType,
      durationSec,
      hook: hooks[i % hooks.length],
      cta: ctas[i % ctas.length],
      painPoint: input.painPoint,
    })
  );

  const skits = [
    generateAdSkit(input),
    generateAdSkit({ ...input, storyType: "educational" }),
  ];

  return {
    product: input.product,
    audience: input.audience,
    storyType,
    hooks,
    ctas,
    variants,
    skits,
    note: "Creative copy and structure only — media generation requires Phase 12–15 providers. Estimates are not guarantees.",
  };
}
