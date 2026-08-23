export interface ContinuityLock {
  characterName: string;
  productName: string;
  environment: string;
  brand?: string;
  lockId: string;
}

export interface StoryboardScene {
  index: number;
  description: string;
  shotType: "wide" | "medium" | "close-up" | "insert";
  durationSec: number;
  dialogueOrVo?: string;
  continuityNotes: string[];
}

export interface Storyboard {
  id: string;
  title: string;
  totalDurationSec: number;
  scenes: StoryboardScene[];
  continuityLock?: ContinuityLock;
  createdAt: string;
}

export interface StoryboardInput {
  product: string;
  audience: string;
  painPoint: string;
  offer: string;
  cta: string;
  region?: string;
  durationSec?: number;
  style?: string;
  platform?: string;
  beats?: string[]; // optional explicit override — supply your own scene beats instead of the UGC-ad template below
  continuityLock?: ContinuityLock;
}

/**
 * Structures a brief into a scene-by-scene storyboard using a standard
 * short-form UGC-ad structure (hook → pain point → solution → offer → CTA)
 * when explicit beats aren't supplied. This is deterministic content
 * structuring, not model-generated creative writing — pair it with a real
 * chat completion (via @superior-ai/ai-gateway) upstream if you want the
 * scene copy itself to be AI-written.
 */
export function buildStoryBoard(input: StoryboardInput): Storyboard {
  const beats = (input.beats?.filter(Boolean)) ?? [
    `Hook: grab attention with the core frustration of ${input.audience}`,
    `Problem: show ${input.painPoint} in a relatable moment`,
    `Solution: introduce ${input.product} solving it`,
    `Proof/offer: ${input.offer}`,
    `Call to action: ${input.cta}`,
  ];
  const totalDurationSec = input.durationSec ?? beats.length * 4;
  const perScene = Math.max(2, Math.round(totalDurationSec / beats.length));
  const scenes: StoryboardScene[] = beats.map((description, i) => ({
    index: i + 1,
    description,
    shotType: i === 0 ? "wide" : i === beats.length - 1 ? "close-up" : "medium",
    durationSec: perScene,
    continuityNotes: input.continuityLock
      ? [`Keep ${input.continuityLock.characterName} and ${input.continuityLock.productName} visually consistent with lock ${input.continuityLock.lockId}`]
      : [],
  }));
  return {
    id: `sb_${Date.now().toString(36)}`,
    title: `${input.product} — ${input.platform ?? "short-form"} (${input.style ?? "ugc"})`,
    totalDurationSec: scenes.reduce((s, x) => s + x.durationSec, 0),
    scenes,
    continuityLock: input.continuityLock,
    createdAt: new Date().toISOString(),
  };
}
