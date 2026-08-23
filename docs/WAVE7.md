# Wave 7

## Observability
- Span tracing + counters + histograms (`@superior-ai/observability`)
- `GET /api/metrics`
- `OTEL_LOG_SPANS=1` for JSON logs

## Rate limiting
- Token bucket presets (API / auth / orchestrate)
- Edge middleware ~180 req/min/IP on `/api/*` → 429

## Stripe Checkout + Portal
- `POST /api/billing/checkout`
- `POST /api/billing/portal`
- UI at `/settings/billing`

## JWKS
- Fetch IdP JWKS + validate iss/aud/exp claims
- Signature verify requires `jose` in production

## Runbook
- `docs/runbook/PRODUCTION.md`
