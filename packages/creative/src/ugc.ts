/**
 * UGC Generator — creator personas, scripts, shot lists.
 * Does not produce synthetic media of real people without authorization flags.
 */

import { buildStoryBoard, type StoryBrief } from "./story-director";
import { planCinematicProduction } from "./cinematic-director";

export interface CreatorPersona {
  id: string;
  displayName: string;
  /** fictional | stock | authorized_likeness */
  identityType: "fictional" | "stock_archetype" | "authorized_likeness";
  ageRange?: string;
  role: string;
  tone: string;
  visualStyle: string;
  voiceNotes: string;
  authorizationRequired: boolean;
  authorizationGranted?: boolean;
}

export interface UgcPackage {
  product: string;
  audience: string;
  persona: CreatorPersona;
  format: "testimonial" | "demo" | "day_in_life" | "unboxing" | "skit";
  durationSec: number;
  script: string[];
  shots: Array<{ order: number; visual: string; line?: string }>;
  captions: string[];
  hashtags: string[];
  platform: string;
  consistencyKeys: string[];
  authorization: {
    likenessOk: boolean;
    voiceOk: boolean;
    notes: string[];
  };
  cinematic?: ReturnType<typeof planCinematicProduction>;
}

const ARCHETYPES: Omit<CreatorPersona, "id">[] = [
  {
    displayName: "SMB Owner",
    identityType: "stock_archetype",
    ageRange: "28-45",
    role: "Small business operator",
    tone: "Direct, practical, slightly hurried",
    visualStyle: "Phone selfie, natural light, office/home",
    voiceNotes: "Conversational; minimal polish",
    authorizationRequired: false,
  },
  {
    displayName: "Ops Manager",
    identityType: "stock_archetype",
    ageRange: "30-50",
    role: "Operations lead",
    tone: "Process-minded, calm",
    visualStyle: "Desk setup, screen-share moments",
    voiceNotes: "Clear diction; medium pace",
    authorizationRequired: false,
  },
  {
    displayName: "Authorized Talent",
    identityType: "authorized_likeness",
    role: "Licensed creator",
    tone: "Per brand brief",
    visualStyle: "Per usage license",
    voiceNotes: "Requires voice model authorization",
    authorizationRequired: true,
  },
];

export function listCreatorPersonas(): CreatorPersona[] {
  return ARCHETYPES.map((a, i) => ({
    ...a,
    id: `persona_${i + 1}`,
  }));
}

export function createUgcPackage(input: {
  product: string;
  audience: string;
  painPoint?: string;
  cta?: string;
  platform?: string;
  durationSec?: number;
  format?: UgcPackage["format"];
  personaId?: string;
  /** Must be true to use authorized_likeness personas or real-person cloning */
  likenessAuthorization?: boolean;
  voiceAuthorization?: boolean;
  region?: string;
}): UgcPackage {
  const personas = listCreatorPersonas();
  let persona =
    personas.find((p) => p.id === input.personaId) ??
    personas.find((p) => p.identityType === "stock_archetype") ??
    personas[0]!;

  const authNotes: string[] = [];
  let likenessOk = true;
  let voiceOk = true;

  if (persona.identityType === "authorized_likeness") {
    persona = {
      ...persona,
      authorizationGranted: input.likenessAuthorization === true,
    };
    likenessOk = input.likenessAuthorization === true;
    voiceOk = input.voiceAuthorization === true;
    if (!likenessOk) {
      authNotes.push(
        "Real-person likeness blocked: set likenessAuthorization=true only with documented rights."
      );
      // fall back to stock archetype
      persona = personas.find((p) => p.identityType === "stock_archetype") ?? persona;
      likenessOk = true;
      authNotes.push(`Fell back to stock archetype: ${persona.displayName}`);
    }
    if (!voiceOk) {
      authNotes.push("Voice cloning blocked without voiceAuthorization=true.");
    }
  } else {
    authNotes.push("Stock/fictional persona — no real-person likeness used.");
  }

  const durationSec = input.durationSec ?? 30;
  const format = input.format ?? "testimonial";
  const pain = input.painPoint ?? "too much manual work";
  const cta = input.cta ?? "Try it free";
  const platform = input.platform ?? "tiktok";

  const script =
    format === "testimonial"
      ? [
          `Hook: I used to struggle with ${pain}.`,
          `Conflict: It cost me time every week.`,
          `Solution: ${input.product} changed that for ${input.audience}.`,
          `Proof: Now I handle follow-ups without the chaos.`,
          `CTA: ${cta}`,
        ]
      : format === "demo"
        ? [
            `Here's ${input.product} in 20 seconds.`,
            `Problem: ${pain}.`,
            `Watch this workflow.`,
            `Result for ${input.audience}.`,
            cta,
          ]
        : [
            `Day in the life with ${input.product}.`,
            `Morning: ${pain}.`,
            `Afternoon: using the product.`,
            `Evening: clearer pipeline.`,
            cta,
          ];

  const shots = script.map((line, i) => ({
    order: i + 1,
    visual:
      i === 0
        ? "Close-up talking head, eye-level"
        : i === script.length - 1
          ? "Product UI or logo end card"
          : "Handheld medium shot / screen insert",
    line,
  }));

  const consistencyKeys = [
    `persona:${persona.id}`,
    `product:${input.product.toLowerCase().replace(/\W+/g, "_")}`,
    "wardrobe:consistent",
    "voice:consistent",
    "location:consistent",
  ];

  const brief: StoryBrief = {
    product: input.product,
    audience: input.audience,
    region: input.region,
    painPoint: pain,
    offer: input.product,
    cta,
    durationSec,
    style: "ugc",
    platform: platform as StoryBrief["platform"],
  };

  const cinematic = planCinematicProduction(brief);

  return {
    product: input.product,
    audience: input.audience,
    persona,
    format,
    durationSec,
    script,
    shots,
    captions: script,
    hashtags: [
      "#ugc",
      `#${input.product.replace(/\W+/g, "")}`.slice(0, 24),
      "#smallbusiness",
    ],
    platform,
    consistencyKeys,
    authorization: {
      likenessOk,
      voiceOk: persona.identityType === "authorized_likeness" ? voiceOk : true,
      notes: authNotes,
    },
    cinematic,
  };
}

export function productTestimonialUgc(input: {
  product: string;
  audience: string;
  quote?: string;
  region?: string;
}): UgcPackage {
  const pack = createUgcPackage({
    ...input,
    format: "testimonial",
    painPoint: "not enough time for follow-ups",
    cta: `See ${input.product}`,
  });
  if (input.quote) {
    pack.script[2] = input.quote;
    pack.captions = [...pack.script];
  }
  return pack;
}
