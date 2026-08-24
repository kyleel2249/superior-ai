# PHASE 14 — Video & Cinematic Studio

**Status:** VERIFIED — **LOCKED**

## Components

| Component | Role |
|-----------|------|
| Story Director | `buildStoryBoard` — hook → conflict → solution → proof → CTA |
| Cinematic Director | Continuity, lighting, camera notes + timeline |
| Timeline | Multi-track: video, captions, VO, music |
| Continuity lock | Character, wardrobe, product, environment, brand |
| Clip stitch plan | Sequences provider clips; no invented URLs |
| Video gen adapter | Plans scenes; `mediaProduced=false` until real provider assets |

## Continuity dimensions

Character · Location · Wardrobe · Lighting · Voice · Story · Product · Brand

## API

```http
POST /api/video { "action": "cinematic", "product": "...", "audience": "...", "durationSec": 30 }
POST /api/video { "action": "timeline" | "stitch" | "extend" | "generate" }
```

## Honesty

Never invents video asset URLs. Provider required for `mediaProduced=true`.

## Acceptance

```text
node scripts/phase14-video.test.mjs → passed
```

## Next

**Phase 15 — UGC, Avatar & Media Cloning**
