/**
 * Cinematic Director Agent — shot language, continuity, lighting notes.
 */

import type { StoryBoard } from "@superior-ai/core";
import { buildStoryBoard, type StoryBrief } from "./story-director";
import { buildTimelineFromScenes, planClipStitch, type VideoTimeline } from "./timeline";

export interface CinematicPlan {
  director: "Cinematic Director";
  brief: StoryBrief;
  storyBoard: StoryBoard;
  timeline: VideoTimeline;
  continuityNotes: string[];
  lightingNotes: string[];
  cameraNotes: string[];
  captionTrack: string[];
  stitch: ReturnType<typeof planClipStitch>;
  disclaimer: string;
}

export function planCinematicProduction(brief: StoryBrief): CinematicPlan {
  const storyBoard = buildStoryBoard(brief);
  const captionTrack = storyBoard.scenes.map((s) => s.description);
  const timeline = buildTimelineFromScenes({
    name: `${brief.product} · ${brief.platform}`,
    aspectRatio: brief.platform === "youtube" ? "16:9" : "9:16",
    scenes: storyBoard.scenes,
    captions: captionTrack,
    voiceover: storyBoard.scenes.map((s) => s.description),
  });

  const continuityNotes = [
    "Character wardrobe/identity locked via continuityKeys across scenes",
    "Product appearance consistent when productPlacement=true",
    "Environment identity stable for daily/office locations",
    "Lighting continuity: match color temperature across continuous scenes",
    "Voice continuity: same VO persona unless scene explicitly changes speaker",
  ];

  const lightingNotes = [
    brief.style === "ugc" ? "Natural available light; avoid heavy cinematic grade for authenticity" : "Keyed commercial lighting; consistent key/fill ratio",
    "Avoid jump cuts that break time of day without transition",
  ];

  const cameraNotes = storyBoard.scenes.map(
    (s) =>
      `Scene ${s.order} (${s.id}): ${s.cameraMovement ?? "static"} · emotion=${s.emotion}`
  );

  const stitch = planClipStitch(
    storyBoard.scenes.map((s) => ({
      sceneId: s.id,
      durationSec: s.durationSec,
      // no assetUrl until provider returns real media
    }))
  );

  return {
    director: "Cinematic Director",
    brief,
    storyBoard,
    timeline,
    continuityNotes,
    lightingNotes,
    cameraNotes,
    captionTrack,
    stitch,
    disclaimer:
      "Plan only until a video provider returns real assets. mediaProduced remains false without provider output.",
  };
}

export function extendStory(
  plan: CinematicPlan,
  extraScene: { description: string; durationSec?: number; emotion?: string }
): CinematicPlan {
  const order = plan.storyBoard.scenes.length + 1;
  const scene = {
    id: `ext_${order}`,
    order,
    description: extraScene.description,
    durationSec: extraScene.durationSec ?? 4,
    emotion: extraScene.emotion ?? "continuation",
    continuityKeys: ["character_primary", "product"],
  };
  const storyBoard = {
    ...plan.storyBoard,
    scenes: [...plan.storyBoard.scenes, scene],
  };
  return planCinematicProduction({
    ...plan.brief,
    durationSec: storyBoard.scenes.reduce((a, s) => a + s.durationSec, 0),
  });
}
