/**
 * Multi-track video timeline model — edit plan without fabricating media.
 */

export type TrackKind = "video" | "audio" | "voiceover" | "music" | "captions" | "gfx";

export interface TimelineClip {
  id: string;
  trackId: string;
  label: string;
  startSec: number;
  durationSec: number;
  sourceSceneId?: string;
  text?: string;
  transitionIn?: string;
  transitionOut?: string;
  status: "planned" | "ready" | "missing_media";
}

export interface TimelineTrack {
  id: string;
  kind: TrackKind;
  name: string;
  clips: TimelineClip[];
}

export interface VideoTimeline {
  id: string;
  name: string;
  durationSec: number;
  aspectRatio: string;
  tracks: TimelineTrack[];
  createdAt: string;
}

function tid(p: string) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`;
}

export function buildTimelineFromScenes(input: {
  name: string;
  aspectRatio: string;
  scenes: Array<{ id: string; description: string; durationSec: number; order: number }>;
  captions?: string[];
  voiceover?: string[];
}): VideoTimeline {
  const sorted = [...input.scenes].sort((a, b) => a.order - b.order);
  let t = 0;
  const videoClips: TimelineClip[] = sorted.map((s) => {
    const clip: TimelineClip = {
      id: tid("clip"),
      trackId: "track_video",
      label: s.description.slice(0, 80),
      startSec: t,
      durationSec: s.durationSec,
      sourceSceneId: s.id,
      transitionIn: t === 0 ? "fade_in" : "cut",
      transitionOut: "cut",
      status: "missing_media",
    };
    t += s.durationSec;
    return clip;
  });

  const captionClips: TimelineClip[] = (input.captions ?? sorted.map((s) => s.description)).map(
    (text, i) => {
      const scene = sorted[i] ?? sorted[sorted.length - 1]!;
      const start = videoClips[i]?.startSec ?? 0;
      return {
        id: tid("cap"),
        trackId: "track_captions",
        label: "caption",
        startSec: start,
        durationSec: scene.durationSec,
        text: text.slice(0, 200),
        status: "planned" as const,
      };
    }
  );

  const voClips: TimelineClip[] = (input.voiceover ?? []).map((text, i) => ({
    id: tid("vo"),
    trackId: "track_vo",
    label: "voiceover",
    startSec: videoClips[i]?.startSec ?? 0,
    durationSec: videoClips[i]?.durationSec ?? 3,
    text,
    status: "planned" as const,
  }));

  const tracks: TimelineTrack[] = [
    { id: "track_video", kind: "video", name: "Video", clips: videoClips },
    { id: "track_captions", kind: "captions", name: "Captions", clips: captionClips },
    { id: "track_vo", kind: "voiceover", name: "Voice-over", clips: voClips },
    {
      id: "track_music",
      kind: "music",
      name: "Music",
      clips: [
        {
          id: tid("music"),
          trackId: "track_music",
          label: "bed",
          startSec: 0,
          durationSec: t,
          status: "missing_media",
        },
      ],
    },
  ];

  return {
    id: tid("tl"),
    name: input.name,
    durationSec: t,
    aspectRatio: input.aspectRatio,
    tracks,
    createdAt: new Date().toISOString(),
  };
}

/** Stitch plan when providers return short clips */
export function planClipStitch(
  clips: Array<{ sceneId: string; durationSec: number; assetUrl?: string }>
): {
  sequence: Array<{ sceneId: string; durationSec: number; hasMedia: boolean }>;
  totalDurationSec: number;
  mediaComplete: boolean;
  note: string;
} {
  const sequence = clips.map((c) => ({
    sceneId: c.sceneId,
    durationSec: c.durationSec,
    hasMedia: Boolean(c.assetUrl),
  }));
  const mediaComplete = sequence.every((s) => s.hasMedia);
  return {
    sequence,
    totalDurationSec: sequence.reduce((a, b) => a + b.durationSec, 0),
    mediaComplete,
    note: mediaComplete
      ? "All clips have media URLs — ready for ffmpeg concat (official pipeline)."
      : "Missing media on one or more clips — stitch deferred. Never invent asset URLs.",
  };
}
