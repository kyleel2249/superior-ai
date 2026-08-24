/**
 * Talking avatar / virtual presenter plans.
 * Lip-sync, expression, gesture — structured plans; media requires authorized providers.
 */

export interface AvatarSpec {
  id: string;
  name: string;
  /** Never set to a real person without authorization */
  identityType: "fictional" | "authorized_likeness";
  appearance: string;
  voiceId?: string;
  style: "presenter" | "tutor" | "support" | "sales";
  authorization: {
    likeness: boolean;
    voice: boolean;
    documentationRef?: string;
  };
}

export interface TalkingAvatarScript {
  avatar: AvatarSpec;
  lines: Array<{
    text: string;
    emotion: string;
    gesture?: string;
    durationSecEst: number;
  }>;
  lipSync: "planned" | "provider_required";
  expressions: string[];
  gestures: string[];
  consistencyKeys: string[];
  status: "planned" | "blocked_authorization" | "provider_required";
  note: string;
}

function aid() {
  return `av_${Date.now().toString(36)}`;
}

export function createFictionalAvatar(input: {
  name?: string;
  style?: AvatarSpec["style"];
  appearance?: string;
}): AvatarSpec {
  return {
    id: aid(),
    name: input.name ?? "Presenter A",
    identityType: "fictional",
    appearance: input.appearance ?? "Neutral professional, non-identifiable composite style",
    style: input.style ?? "presenter",
    authorization: { likeness: true, voice: true },
  };
}

export function createAuthorizedAvatar(input: {
  name: string;
  appearance: string;
  voiceId?: string;
  likenessAuthorized: boolean;
  voiceAuthorized: boolean;
  documentationRef?: string;
  style?: AvatarSpec["style"];
}): AvatarSpec {
  return {
    id: aid(),
    name: input.name,
    identityType: "authorized_likeness",
    appearance: input.appearance,
    voiceId: input.voiceId,
    style: input.style ?? "presenter",
    authorization: {
      likeness: input.likenessAuthorized,
      voice: input.voiceAuthorized,
      documentationRef: input.documentationRef,
    },
  };
}

export function buildTalkingAvatarScript(input: {
  avatar: AvatarSpec;
  script: string[];
  product?: string;
}): TalkingAvatarScript {
  if (
    input.avatar.identityType === "authorized_likeness" &&
    (!input.avatar.authorization.likeness || !input.avatar.authorization.voice)
  ) {
    return {
      avatar: input.avatar,
      lines: [],
      lipSync: "provider_required",
      expressions: [],
      gestures: [],
      consistencyKeys: [],
      status: "blocked_authorization",
      note: "Refusing to plan real-person avatar output without likeness and voice authorization.",
    };
  }

  const emotions = ["neutral", "friendly", "emphasis", "smile", "confident"];
  const gestures = ["open_palm", "nod", "point_subtle", "count_fingers", "rest"];

  const lines = input.script.map((text, i) => ({
    text,
    emotion: emotions[i % emotions.length]!,
    gesture: gestures[i % gestures.length],
    durationSecEst: Math.max(2, Math.ceil(text.split(/\s+/).length / 2.5)),
  }));

  return {
    avatar: input.avatar,
    lines,
    lipSync: "provider_required",
    expressions: [...new Set(lines.map((l) => l.emotion))],
    gestures: [...new Set(lines.map((l) => l.gesture!).filter(Boolean))],
    consistencyKeys: [
      `avatar:${input.avatar.id}`,
      `identity:${input.avatar.identityType}`,
      input.product ? `product:${input.product}` : "product:none",
      "voice:continuous",
      "appearance:locked",
    ],
    status: "provider_required",
    note: "Avatar performance planned. Connect authorized TTS + lip-sync + avatar renderer APIs to produce media. No fabricated video/audio URLs.",
  };
}
