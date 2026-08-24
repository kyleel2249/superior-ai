# PHASE 19 — CRM, Sales & Lead Engine

**Status:** VERIFIED — **LOCKED**

## Sales (`@superior-ai/sales`)

- Lead shells (no invented contacts)
- Scoring & qualification
- Personalized outreach drafts (approval before send)
- Inbound/outbound sequences
- Proposal drafts
- Local pipeline + deals
- Autopilot mode allow-lists
- Full-funnel stage map

## CRM (`@superior-ai/crm`)

Connectors: HubSpot · Salesforce · Zoho · Pipedrive · custom  
`CONFIGURATION_REQUIRED` until credentials provided.

## API

```http
POST /api/sales { "action": "create_lead", "company": "Acme", "website": "https://..." }
POST /api/sales { "action": "sequence" | "proposal" | "qualify" | "outreach" | "deal" }
GET  /api/sales?view=pipeline
POST /api/crm { "action": "test" | "upsert_contact" | "create_deal", "provider": "hubspot" }
```

## Honesty

Never invent emails or phone numbers. External outreach requires approval.

## Acceptance

```text
node scripts/phase19-sales.test.mjs → passed
```

## Next

**Phase 20 — Customer Experience & Support**
