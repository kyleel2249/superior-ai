/**
 * @superior-ai/creative
 *
 * Did not exist — apps/web/src/app/api/video/route.ts calls buildStoryBoard()
 * with a specific input shape already. This implementation matches that call
 * site exactly rather than inventing an unrelated API.
 */

export type VideoPlatform = "tiktok" | "instagram" | "youtube" | "facebook" | "x";
export type VideoStyle = "ugc" | "cinematic" | "product-demo" | "testimonial" | "animated";

export interface StoryBoardInput {
  product: string;
  audience: string;
  region?: string;
  painPoint: string;
  offer: string;
  cta: string;
  durationSec: number;
  style: VideoStyle;
  platform: VideoPlatform;
}

export interface StoryBoardScene {
  order: number;
  seconds: number;
  beat: "hook" | "problem" | "solution" | "proof" | "cta";
  description: string;
}

export interface StoryBoard {
  product: string;
  audience: string;
  platform: VideoPlatform;
  style: VideoStyle;
  durationSec: number;
  scenes: StoryBoardScene[];
}

/**
 * Splits the requested duration across a fixed 5-beat direct-response arc
 * (hook / problem / solution / proof / cta), weighted so the hook and CTA
 * stay short and the solution beat gets the most time.
 */
export function buildStoryBoard(input: StoryBoardInput): StoryBoard {
  const weights: Record<StoryBoardScene["beat"], number> = {
    hook: 0.15,
    problem: 0.2,
    solution: 0.35,
    proof: 0.2,
    cta: 0.1,
  };
  const beats: StoryBoardScene["beat"][] = ["hook", "problem", "solution", "proof", "cta"];
  const descriptions: Record<StoryBoardScene["beat"], string> = {
    hook: `Open on ${input.audience} facing ${input.painPoint}.`,
    problem: `Show the cost of ${input.painPoint} for ${input.audience}.`,
    solution: `Introduce ${input.product} as the fix — show it solving ${input.painPoint}.`,
    proof: `Show ${input.product} working in a real ${input.region ?? "market"} context.`,
    cta: `Direct call to action: ${input.cta}.`,
  };

  let allocated = 0;
  const scenes: StoryBoardScene[] = beats.map((beat, i) => {
    const seconds =
      i === beats.length - 1
        ? input.durationSec - allocated
        : Math.max(1, Math.round(input.durationSec * weights[beat]));
    allocated += seconds;
    return { order: i + 1, seconds, beat, description: descriptions[beat] };
  });

  return {
    product: input.product,
    audience: input.audience,
    platform: input.platform,
    style: input.style,
    durationSec: input.durationSec,
    scenes,
  };
}
