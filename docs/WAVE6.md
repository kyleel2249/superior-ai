# Wave 6

## Auth
- HS256 JWT + httpOnly `superior_session` cookie
- Logout revocation

## Stripe
- createCustomer, reportMeteredUsage
- Webhook: invoice.paid, payment_failed, subscription.*
- POST /api/billing/webhook

## Instagram
- Meta Graph container + publish when configured

## E2E
- e2e/flows.spec.ts (studio, sales, campaigns, billing, cookie)

## CI
- pgvector Postgres + Redis services + migration

## Terraform
- Optional AWS ECR/ECS (`enable=false`)
