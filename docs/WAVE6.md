# Wave 6

## Auth (JWT + cookies)
- HS256 JWT sessions (`AUTH_SECRET`)
- HttpOnly `superior_session` cookie on login
- Revocation set for logout
- OIDC routes unchanged; production should add JWKS validation

## Stripe
- `createCustomer`, `reportMeteredUsage`
- Webhook handler: invoice.paid / payment_failed / subscription.*
- `POST /api/billing/webhook`

## Instagram
- Meta Graph content publish (container + publish) when business account configured
- Requires App Review permissions in production

## E2E
- `e2e/flows.spec.ts` — studio, sales, campaigns, billing, session cookie

## CI
- Postgres (pgvector) + Redis service containers
- Runs pgvector migration SQL

## Terraform
- Optional AWS ECR/ECS scaffold (`enable=false` by default)
