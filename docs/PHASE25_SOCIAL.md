# PHASE 25 — Social & Autopublish

**Status:** VERIFIED — **LOCKED**

## Platforms (official APIs only)

linkedin · x · facebook · instagram · youtube · tiktok · pinterest

Missing tokens → `CONFIGURATION_REQUIRED`. No ToS bypass.

## Autopublish queue

1. `enqueue` / `batch_enqueue` → awaiting approval  
2. `approve`  
3. `publish_queue` → calls official API  
4. Audit event `social.publish`

Direct publish still requires `approved: true`.

## API

```http
GET  /api/social
GET  /api/social?view=queue
POST /api/social { "action": "enqueue", "platform": "linkedin", "text": "..." }
POST /api/social { "action": "approve", "id": "..." }
POST /api/social { "action": "publish_queue", "id": "..." }
POST /api/social { "approved": true, "platform": "x", "text": "..." }
```

## Acceptance

```text
node scripts/phase25-social.test.mjs → passed
```

## Next

**Phase 26** — per inventory: remaining integration/ops (billing adapters stay optional/off by default)
