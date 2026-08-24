# PHASE 12 — Image & Brand Studio

**Status:** VERIFIED — **LOCKED**

## Brand system (`@superior-ai/brand`)

- Letterform / monogram SVG concepts (geometric, curved, sleek, negative-space, …)
- Palette + typography suggestions
- Brand kit export (JSON / pack)
- Social & ad asset size specs (favicon, OG, Instagram, LinkedIn, ads)
- UI: `/brand`

## Image generation (`generateImage`)

- Provider adapters (OpenAI when keyed)
- Honest resolution labels: Native | Upscaled | Final
- Never claims native 8K unless provider returns 8K

## Image editing (`editImage`)

Operations registered: removal, replacement, fill, upscale/SR, retouch, composite, background replace, in/outpaint.  

Without provider + binary upload path → `CONFIGURATION_REQUIRED` (no fake images).

## API

```http
POST /api/brand { "initials": "SA", "brandName": "SUPERIOR AI" }
POST /api/images { "action": "generate", "prompt": "..." }
POST /api/images { "action": "edit", "op": "inpaint", "imageBase64": "..." }
GET  /api/images  → list edit ops
```

## Acceptance

```text
node scripts/phase12-brand-image.test.mjs → passed
```

## Next

**Phase 13 — Vector & Professional Design Studio**
