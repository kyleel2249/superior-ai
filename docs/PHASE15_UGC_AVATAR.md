# PHASE 15 — UGC, Avatar & Media Cloning

**Status:** VERIFIED — **LOCKED**

## UGC

- Creator personas (stock archetypes vs authorized likeness)
- Formats: testimonial, demo, day-in-life, unboxing, skit
- Scripts, shots, captions, hashtags, consistency keys
- Optional cinematic plan attachment

## Avatars

- Fictional presenters (default safe path)
- Authorized likeness requires `likenessAuthorization` + `voiceAuthorization`
- Talking script with emotion, gesture, lip-sync **planned**
- Status `blocked_authorization` if rights missing

## Policy

Real-person face/voice cloning is refused without explicit authorization flags and documentation reference.

## API

```http
GET  /api/ugc
POST /api/ugc { "product": "...", "audience": "..." }
POST /api/ugc { "action": "testimonial", ... }
POST /api/ugc { "action": "avatar", "authorized": true, "likenessAuthorization": true, "voiceAuthorization": true }
POST /api/ugc { "action": "talking", "script": ["..."] }
```

## Acceptance

```text
node scripts/phase15-ugc.test.mjs → passed
```

## Next

**Phase 16 — Advertising & Story Engine**
